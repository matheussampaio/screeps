import * as _ from 'lodash'

import { ActionsRegistry, Action } from '../../core'
import * as utils from '../../utils'
import { RectCoordinates, MinCut, Coordinates } from '../../utils/min-cut'

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

    return this.waitNextTick()
    // return this.sleep(5)
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
      this.setPos(spawn.pos.x, spawn.pos.y, [STRUCTURE_SPAWN])

      utils.getEmptySpacesAroundPosition(spawn.pos).forEach(pos => {
        this.setPos(pos.x, pos.y, [STRUCTURE_ROAD])
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

    const minerals = this.room.find(FIND_MINERALS)

    // block tiles around minerals and place extractor
    for (const mineral of minerals) {
      utils.getNeighborsPositions(mineral.pos).forEach(pos => {
        this.costMatrix.set(pos.x, pos.y, Infinity)
      })

      utils.getEmptySpacesAroundPosition(mineral.pos).forEach(pos => {
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
        this.setPos(pos.x, pos.y, [STRUCTURE_ROAD])
      }
    }

    // block and plan roads to minerals
    for (const mineral of minerals) {
      const result = this.search(mineral.pos)

      if (result.incomplete) {
        continue
      }

      for (const pos of result.path.slice(1)) {
        this.setPos(pos.x, pos.y, [STRUCTURE_ROAD])
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
        this.setPos(pos.x, pos.y, [STRUCTURE_ROAD])
      }
    }

    this.placeSpawners()

    this.placeExtensions()

    this.placeTowers()

    this.placeWallsAndRamparts()

    this.placeExtractors()
  }

  private placeSpawners() {
    const spawners = this.room.find(FIND_MY_SPAWNS)

    for (let i = spawners.length; i < CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][8]; i++) {
      const pos = this.findSuitablePlaceForStructure(STRUCTURE_SPAWN)

      if (pos == null) {
        break
      }

      // place rounds around spawner
      utils.getEmptySpacesAroundPosition(pos)
        .forEach(pos => this.setPos(pos.x, pos.y, [STRUCTURE_ROAD]))

      this.placeStructure(pos, STRUCTURE_SPAWN)
    }
  }

  private placeExtractors() {
    const minerals = this.room.find(FIND_MINERALS)

    for (let i = 0; i < CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][8]; i++) {
      const mineral = minerals.shift()

      if (mineral == null) {
        break
      }

      this.placeStructure(mineral.pos, STRUCTURE_EXTRACTOR)
    }
  }

  private placeWallsAndRamparts() {
    const protectedArea: RectCoordinates[] = []

    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const value = this.getPos(x, y)

        if (value.length && !value.includes(STRUCTURE_ROAD)) {
          protectedArea.push({ x1: x - 1, y1: y - 1, x2: x + 1, y2: y + 1})
        }
      }
    }

    // Boundary Array for Maximum Range
    const bounds: RectCoordinates = { x1: 0, y1: 0, x2: 49, y2: 49 }

    const positions: Coordinates[] = MinCut.GetCutTiles(this.context.roomName, protectedArea, bounds)

    for (const pos of positions) {
      const value = this.getPos(pos.x, pos.y)

      if (!value.length) {
        this.setPos(pos.x, pos.y, [STRUCTURE_WALL])
      } else {
        this.setPos(pos.x, pos.y, [...value, STRUCTURE_RAMPART], true)
      }
    }
  }

  private resetPlanIfFlag() {
    const flag = Game.flags['reset-plan']

    if (flag && flag.room && flag.room.name === this.context.roomName) {
      flag.remove()

      this.context.planner = null
    }
  }

  private placeStorage() {
    // place storage in the center
    this.placeStructure(this.center, STRUCTURE_STORAGE, true)

    // place rounds around storage
    utils.getEmptySpacesAroundPosition(this.center)
      .forEach(pos => this.setPos(pos.x, pos.y, [STRUCTURE_ROAD]))
  }

  private placeExtensions() {
    for (let i = 0; i < CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][8]; i++) {
      const pos = this.findSuitablePlaceForStructure(STRUCTURE_EXTENSION)

      if (pos == null) {
        break
      }

      this.placeStructure(pos, STRUCTURE_EXTENSION)
    }
  }

  private placeTowers() {
    for (let i = 0; i < CONTROLLER_STRUCTURES[STRUCTURE_TOWER][8]; i++) {
      const pos = this.findSuitablePlaceForStructure(STRUCTURE_TOWER)

      if (pos == null) {
        break
      }

      this.placeStructure(pos, STRUCTURE_TOWER)
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
      if (this.getPos(pos.x, pos.y).length) {
        continue
      }

      // if this position is protected in the cost matrix
      if (this.costMatrix.get(pos.x, pos.y) >= 50) {
        continue
      }

      if (structureType === STRUCTURE_SPAWN && utils.getEmptySpacesAroundPosition(pos).length < 8) {
        continue
      }

      // if this position has a road connected to it, it's a nice fit
      // (assuming the road is not a dead end)
      if (neighbors.find(p => this.getPos(p.x, p.y).includes(STRUCTURE_ROAD))) {
        return pos
      }
    }

    console.log(`can't find a place for ${structureType}`)

    return null
  }

  private placeStructure(pos: RoomPosition, structureType: BuildableStructureConstant, force: boolean = false) {
    this.setPos(pos.x, pos.y, [structureType], force)
  }

  private get map(): BuildableStructureConstant[][] {
    return this.mem.map || (this.mem.map = Array(50 * 50).fill([]))
  }

  private getPos(x: number, y: number): BuildableStructureConstant[] {
    return this.map[y * 50 + x]
  }

  private setPos(x: number, y: number, value: BuildableStructureConstant[], force: boolean = false) {
    const idx = y * 50 + x

    if (this.map[idx].length === 0 || force) {
      this.map[y * 50 + x] = value
      this.costMatrix.set(x, y, value.includes(STRUCTURE_ROAD) ? 1 : Infinity)
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

