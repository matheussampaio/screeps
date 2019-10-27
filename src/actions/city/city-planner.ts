import * as _ from 'lodash'

import { ActionsRegistry, Action } from '../../core'
import * as utils from '../../utils'

const cms: any = {}

@ActionsRegistry.register
export class CityPlanner extends Action {
  private context: any

  run(context: any) {
    this.context = context

    this.resetPlanIfFlag()

    if (this.mem.plannedAt == null) {
      this.replan()
    }

    return this.sleep(5)
  }

  private get costMatrix(): CostMatrix {
    const cm = cms[this.context.roomName] || (cms[this.context.roomName] = {})

    if (cm.time !== Game.time) {
      cm.time = Game.time
      cm.matrix = new PathFinder.CostMatrix()

      const roads = this.room.find(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_ROAD
      })

      roads.forEach(road => cm.matrix.set(road.pos.x, road.pos.y, 1))
    }

    return cm.matrix
  }

  private replan() {
    this.mem.plannedAt = Game.time

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

  private placeStorage() {
    utils.getEmptySpacesAroundPosition(this.center)
      .forEach(pos => this.setPos(pos.x, pos.y, STRUCTURE_ROAD))

    this.placeStructure(this.center, STRUCTURE_STORAGE, true)
  }

  private placeExtensions() {
    for (let i = 0; i < 60; i++) {
      const pos = this.findSuitablePlaceForStructure(STRUCTURE_EXTENSION)

      if (pos) {
        this.placeStructure(pos, STRUCTURE_EXTENSION)
      }
    }
  }

  private placeTowers() {
    for (let i = 0; i < 6; i++) {
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
}

