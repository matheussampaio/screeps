import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CityPlanner extends Action {
  private context: any
  private _costMatrix?: CostMatrix

  run(context: any): [ACTIONS_RESULT, ...string[]] {
    this.context = context

    this.resetPlanIfFlag()

    if (this.mem.level !== this.controller.level) {
      this.replan()
      this.mem.level = this.controller.level
    }

    if (_.size(Game.constructionSites) >= MAX_CONSTRUCTION_SITES) {
      return this.waitNextTick()
    }

    this.visualize()

    if (this.mem.nextPrune <= Game.time) {
      const constructionSites = this.room.find(FIND_MY_CONSTRUCTION_SITES).length

      if (!constructionSites) {
        this.prune(STRUCTURE_ROAD, 10) ||
          this.prune(STRUCTURE_EXTENSION, 1) ||
          this.prune(STRUCTURE_TOWER, 1) ||
          this.prune(STRUCTURE_STORAGE, 1)
      }

      this.mem.nextPrune = Game.time + 100
    }

    if (this.mem.nextConstruction <= Game.time) {
      this.createConstructionSites()

      this.mem.nextConstruction = Game.time + 102
    }

    return this.waitNextTick()
  }

  private prune(structureType: BuildableStructureConstant, maxPrune = 100): boolean {
    const structures = this.room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === structureType
    })

    for (const structure of structures) {
      const desiredStructure = this.getPos(structure.pos.x, structure.pos.y)

      if (desiredStructure !== structureType) {
        console.log(`prune: destroying STRUCTURE. it should be ${desiredStructure}, but it is ${structure.structureType}`)

        structure.destroy()
        maxPrune--

        if (!maxPrune) {
          return true
        }
      }
    }

    const constructionSites = this.room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: s => s.structureType === structureType
    })

    for (const constructionSite of constructionSites) {
      const desiredConstruction = this.getPos(constructionSite.pos.x, constructionSite.pos.y) 

      if (desiredConstruction !== structureType) {
        console.log(`prune: destroying CONSTRUCTION. it should be ${desiredConstruction}, but it is ${constructionSite.structureType}`)

        constructionSite.remove()
        maxPrune--

        if (!maxPrune) {
          return true
        }
      }
    }

    return false
  }

  private replan() {
    this._costMatrix = undefined

    const exits = [
      FIND_EXIT_TOP,
      FIND_EXIT_RIGHT,
      FIND_EXIT_BOTTOM,
      FIND_EXIT_LEFT
    ]

    // block tiles around controller
    utils.getEmptySpacesAroundPosition(this.controller.pos).forEach(pos => {
      this.costMatrix.set(pos.x, pos.y, Infinity)
    })

    // block tiles around spawners
    const spawns = this.room.find(FIND_MY_SPAWNS)

    for (const spawn of spawns) {
      this.setPos(spawn.pos.x, spawn.pos.y, STRUCTURE_SPAWN)

      utils.getEmptySpacesAroundPosition(spawn.pos).forEach(pos => {
        this.setPos(pos.x, pos.y, STRUCTURE_ROAD)
      })
    }

    const sources = this.room.find(FIND_SOURCES)

    // block tiles around sources
    for (const source of sources) {
      utils.getNeighborsPositions(source.pos).forEach(pos => {
        this.costMatrix.set(pos.x, pos.y, Infinity)
      })

      utils.getEmptySpacesAroundPosition(source.pos).forEach(pos => {
        this.costMatrix.set(pos.x, pos.y, 5)
      })
    }

    this.placeStorage()

    // block and plan roads to sources
    for (const source of sources) {
      const result = this.search(source.pos)

      if (result.incomplete) {
        continue
      }

      for (const pos of result.path.slice(1)) {
        this.setPos(pos.x, pos.y, STRUCTURE_ROAD)
      }
    }

    // block and plan roads to exits
    for (const exit of exits) {
      const exitPosition = this.room.find(exit)

      if (exitPosition == null) {
        continue
      }

      const result = this.search(exitPosition, 1)

      if (result.incomplete) {
        continue
      }

      for (const pos of result.path.slice(1)) {
        this.setPos(pos.x, pos.y, STRUCTURE_ROAD)
      }
    }

    this.placeExtensions()

    this.placeTowers()
  }

  private resetPlanIfFlag() {
    const flag = Game.flags['reset-plan']

    if (flag && flag.room && flag.room.name === this.context.roomName) {
      flag.remove()

      this.context.planner = null
    }
  }

  private createConstructionSites(): [ACTIONS_RESULT.WAIT_NEXT_TICK] | null {
    const constructionOrder: BuildableStructureConstant[] = []

    if (this.controller.level >= 2) {
      constructionOrder.push(STRUCTURE_EXTENSION)
    }

    if (this.controller.level >= 3) {
      constructionOrder.push(STRUCTURE_ROAD, STRUCTURE_TOWER, STRUCTURE_WALL, STRUCTURE_RAMPART)
    }

    if (this.controller.level >= 4) {
      constructionOrder.push(STRUCTURE_STORAGE)
    }

    for (const structureType of constructionOrder) {
      const positions = this.findStructuresToBeConstructed(structureType)

      if (positions.length) {
        const pos = _.head(positions) as RoomPosition

        console.log(`creating ${structureType} at ${pos.x},${pos.y}`, this.room.createConstructionSite(pos.x, pos.y, structureType))

        return this.waitNextTick()
      }
    }

    return null
  }

  private findStructuresToBeConstructed(structureType: BuildableStructureConstant): RoomPosition[] {
    const positions = []

    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const st = this.getPos(x, y)

        if (st === structureType) {
          const result = this.room.lookAt(x, y)

          const isTileFree = result.every(item => item.type !== LOOK_STRUCTURES && item.type !== LOOK_CONSTRUCTION_SITES)

          if (isTileFree) {
            positions.push(this.room.getPositionAt(x, y) as RoomPosition)
          }
        }
      }
    }

    return positions
  }

  private get costMatrix(): CostMatrix {
    if (this._costMatrix == null) {
      this._costMatrix = new PathFinder.CostMatrix()
    }

    return this._costMatrix
  }

  private getStructureCounter(structureType: BuildableStructureConstant): number {
    let counter = 0

    for (let i = 0; i < this.map.length; i++) {
      if (this.map[i] === structureType) {
        counter += 1
      }
    }

    return counter
  }

  private placeStorage() {
    utils.getEmptySpacesAroundPosition(this.center)
      .forEach(pos => this.setPos(pos.x, pos.y, STRUCTURE_ROAD))

    this.placeStructure(this.center, STRUCTURE_STORAGE, true)
  }

  private placeExtensions() {
    const extensionsCounter = this.getStructureCounter(STRUCTURE_EXTENSION)

    const maxNumberExtensions: { [level: number]: number } = {
      1: 0,
      2: 5,
      3: 10,
      4: 20,
      5: 30,
      6: 40,
      7: 50,
      8: 60
    }

    const missingExtensions = maxNumberExtensions[this.controller.level] - extensionsCounter

    for (let i = 0; i < missingExtensions; i++) {
      const pos = this.findSuitablePlaceForStructure(STRUCTURE_EXTENSION)

      if (pos) {
        this.placeStructure(pos, STRUCTURE_EXTENSION)
      }
    }
  }

  private placeTowers() {
    const towersCounter = this.getStructureCounter(STRUCTURE_TOWER)

    const maxTowerNumber: { [level: number]: number } = {
      1: 0,
      2: 0,
      3: 1,
      4: 1,
      5: 2,
      6: 2,
      7: 3,
      8: 6
    }

    const missingTowers =  maxTowerNumber[this.controller.level] - towersCounter

    for (let i = 0; i < missingTowers; i++) {
      const pos = this.findSuitablePlaceForStructure(STRUCTURE_TOWER)

      if (pos) {
        this.placeStructure(pos, STRUCTURE_TOWER)
      }
    }
  }

  private findSuitablePlaceForStructure(structureType: BuildableStructureConstant): RoomPosition | null {
    const queue = [this.center]

    const visited = Array(50 * 50).fill(0)
    const terrain = this.room.getTerrain()

    while (queue.length) {
      const pos = queue.shift() as RoomPosition
      const idx = pos.y * 50 + pos.x

      if (visited[idx]) {
        continue
      }

      visited[idx] = 1

      // queue their neighbors to the be visited
      const neighbors = utils.getNeighborsPositions(pos)
      queue.push(...neighbors)

      // if it is a border position, skip it
      if (pos.x === 0 || pos.y === 0 || pos.x === 49 || pos.y === 49) {
        continue
      }

      // if this is a wall, skip it
      if (terrain.get(pos.x, pos.y) & TERRAIN_MASK_WALL) {
        continue
      }

      // if this position is the center, skip it (since it's reserved to storage)
      if (pos.x === this.center.x && pos.y === this.center.y) {
        continue
      }

      // if this position is already taken, continue
      if (this.getPos(pos.x, pos.y) != null) {
        continue
      }

      // if this position is protected in the cost matrix
      if (this.costMatrix.get(pos.x, pos.y) >= 50) {
        continue
      }

      // if this position has a road connected to it, it's a nice fit
      // (assuming the road is not a dead end)
      if (neighbors.find(p => this.getPos(p.x, p.y) === STRUCTURE_ROAD)) {
        return pos
      }

      // return pos

      // const construtableTiles = utils.getEmptySpacesAroundPosition(pos).map(pos => ({
      //   pos,
      //   structureType: this.getPos(pos.x, pos.y),
      //   cost: this.costMatrix.get(pos.x, pos.y)
      // }))

      // const emptyTile = construtableTiles.find(tile => tile.structureType == null && tile.cost < 100)

      // if (emptyTile) {
      //   return emptyTile.pos
      // }

      // const roads = construtableTiles.filter(tile => tile.structureType === STRUCTURE_ROAD)

      // roads.forEach(road => queue.push(road.pos))
    }

    console.log(`can't find a place for ${structureType}`)

    return null
  }

  private placeStructure(pos: RoomPosition, structureType: BuildableStructureConstant, force: boolean = false) {
    this.setPos(pos.x, pos.y, structureType, force)
  }

  private get map(): (BuildableStructureConstant | null)[] {
    return this.mem.map || (this.mem.map = Array(50 * 50).fill(null))
  }

  private getPos(x: number, y: number): BuildableStructureConstant | null {
    return this.map[y * 50 + x]
  }

  private setPos(x: number, y: number, value: BuildableStructureConstant | null, force: boolean = false) {
    const idx = y * 50 + x

    if (this.map[idx] == null || force) {
      this.map[y * 50 + x] = value
      this.costMatrix.set(x, y, value === STRUCTURE_ROAD ? 1 : Infinity)
    }
  }

  private search(pos: RoomPosition | RoomPosition[], range = 1): PathFinderPath {
    const opts: PathFinderOpts = {
      roomCallback: (roomName: string): boolean | CostMatrix => {
        if (roomName === this.room.name) {
          return this.costMatrix
        }

        return false
      },
      plainCost: 2,
      swampCost: 5
    }

    const positions = _.isArray(pos) ? pos : [pos]

    const goals = positions.map(pos => ({ pos, range }))

    return PathFinder.search(this.center, goals, opts)
  }

  private get room(): Room {
    return Game.rooms[this.context.roomName]
  }

  private get controller(): StructureController {
    return this.room.controller as StructureController
  }

  private get mem(): any {
    if (this.context.planner == null) {
      this.context.planner = {
        nextPrune: Game.time + 1,
        nextConstruction: Game.time + 2,
      }
    }

    return this.context.planner
  }

  private get center(): RoomPosition {
    if (this.mem.center) {
      const { x, y } = this.mem.center

      return this.room.getPositionAt(x, y) as RoomPosition
    }

    const queue = utils.getEmptySpacesAroundPosition(this.controller.pos, 3)

    queue.sort((p1, p2) => {
      const ep1 = utils.getEmptySpacesAroundPosition(p1).length
      const ep2 = utils.getEmptySpacesAroundPosition(p2).length

      return ep2 - ep1
    })

    const center = _.head(queue) || this.controller.pos

    this.mem.center = {
      x: center.x,
      y: center.y
    }

    return center
  }

  private visualize() {
    const flag = Game.flags['visual']

    if (flag == null) {
      return
    }

    this.room.visual.circle(this.center.x, this.center.y, { radius: 0.5, fill: '#00ff00' })

    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const value = this.getPos(x, y)

        if (value === STRUCTURE_ROAD) {
          const neighbors = utils.getNeighborsCoords(x, y)

          neighbors.forEach(coord => {
            const v2 = this.getPos(coord.x, coord.y)

            if (v2 === STRUCTURE_ROAD) {
              this.room.visual.line(x, y, coord.x, coord.y, { color: '#808080', opacity: 0.25 })
            }
          })
        } else if (value === STRUCTURE_STORAGE) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#ff0000' })
        } else if (value === STRUCTURE_SPAWN) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#0000ff' })
        } else if (value === STRUCTURE_EXTENSION) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#ff00ff' })
        }

        if (this.costMatrix.get(x, y)) {
          this.room.visual.text(this.costMatrix.get(x, y).toString(), x, y, { align: 'center' })
        }
      }
    }
  }
}

