import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import * as utils from '../../utils'
import { RectCoordinates, MinCut, Coordinates } from '../../utils/min-cut'
import { ICityContext } from './interfaces'
import { City } from './city'

@ActionsRegistry.register
export class CityPlanner extends City {
  run(context: ICityContext) {
    this.context = context

    this.resetPlanIfFlag()

    if (this.planner.plannedAt == null) {
      this.replan()
    }

    const maxWorkPartAllowedByEnergyCapacity = this.getMaxWorkPartAllowedByEnergyCapacity()

    if (this.planner.energyCapacityAvailable !== this.room.energyCapacityAvailable) {
      this.planner.energyCapacityAvailable = this.room.energyCapacityAvailable

      for (const sourceId in this.planner.sources) {
        const source: Source | null = Game.getObjectById(sourceId)
        const sourcePlan = this.planner.sources[sourceId]

        if (source == null) {
          continue
        }

        const desiredWorkParts = Math.min(this.OPTIMUM_WORK_PARTS_PER_SOURCE, maxWorkPartAllowedByEnergyCapacity * sourcePlan.emptySpaces)

        sourcePlan.desiredWorkParts = desiredWorkParts
      }
    }

    return this.waitNextTick()
    // return this.sleep(5)
  }

  private getMaxWorkPartAllowedByEnergyCapacity(): number {
    return Math.floor(
      (this.room.energyCapacityAvailable - BODYPART_COST[MOVE] - BODYPART_COST[CARRY]) / BODYPART_COST[WORK]
    )
  }

  private replan() {
    this.planner.plannedAt = Game.time

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

      for (const pos of result.path.slice(1, result.path.length - 1)) {
        this.setPos(pos.x, pos.y, [STRUCTURE_ROAD])
      }

      const lastPos = result.path[result.path.length - 1] as RoomPosition

      this.setPos(lastPos.x, lastPos.y, [STRUCTURE_ROAD, STRUCTURE_CONTAINER])

      const neighbors = utils.getEmptySpacesAroundPosition(lastPos)
      let linkPos

      for (const neighbor of neighbors) {
        if (this.getPos(neighbor.x, neighbor.y).length === 0) {
          this.setPos(neighbor.x, neighbor.y, [STRUCTURE_LINK])
          linkPos = neighbor
          break
        }
      }

      _.defaultsDeep(this.planner, {
        sources: {
          [source.id]: {
            linkPos,
            id: source.id,
            harvesters: [],
            haulers: [],
            containerPos: lastPos,
            distance: result.path.length,
            emptySpaces: utils.getEmptySpacesAroundPosition(source.pos).length,
            desiredWorkParts: 0,
            desiredCarryParts: 0
          }
        }
      })
    }

    // block and plan roads to minerals
    for (const mineral of minerals) {
      const result = this.search(mineral.pos)

      if (result.incomplete) {
        continue
      }

      for (const pos of result.path.slice(1, result.path.length - 1)) {
        this.setPos(pos.x, pos.y, [STRUCTURE_ROAD])
      }

      const lastPos = result.path[result.path.length - 1] as RoomPosition

      this.setPos(lastPos.x, lastPos.y, [STRUCTURE_ROAD, STRUCTURE_CONTAINER])

      const neighbors = utils.getEmptySpacesAroundPosition(lastPos)

      for (const neighbor of neighbors) {
        if (this.getPos(neighbor.x, neighbor.y).length === 0) {
          this.planner.mineralLinkPos = neighbor
          this.setPos(neighbor.x, neighbor.y, [STRUCTURE_LINK])
          break
        }
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

    this.placeStructureType(STRUCTURE_TOWER)

    this.placeStructureType(STRUCTURE_TERMINAL)

    this.placeStructureType(STRUCTURE_EXTENSION)

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

      // place roads around spawner
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

    const positions: Coordinates[] = MinCut.GetCutTiles(this.room.name, protectedArea, bounds)

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
      if (this.room.name !== 'sim') {
        flag.remove()
      }

      delete this.context.planner
    }
  }

  private placeStorage() {
    // place storage in the center
    this.placeStructure(this.center, STRUCTURE_STORAGE, true)

    // place roads around storage
    utils.getEmptySpacesAroundPosition(this.center)
      .forEach(pos => this.setPos(pos.x, pos.y, [STRUCTURE_ROAD]))

    const positions = utils.getEmptySpacesAroundPosition(this.center, 2)

    // place link close to storage
    for (const pos of positions) {
      const structures = this.getPos(pos.x, pos.y)

      if (structures.length === 0) {
        this.planner.storageLinkPos = pos
        this.setPos(pos.x, pos.y, [STRUCTURE_LINK])
        break
      }
    }
  }

  private placeStructureType(structureType: BuildableStructureConstant) {
    for (let i = 0; i < CONTROLLER_STRUCTURES[structureType][8]; i++) {
      const pos = this.findSuitablePlaceForStructure(structureType)

      if (pos == null) {
        break
      }

      this.placeStructure(pos, structureType)
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

      if (structureType === STRUCTURE_SPAWN) {
        const positions = utils.getEmptySpacesAroundPosition(pos)

        if (positions.length < 8) {
          continue
        }

        const neighborsWillBeAStructure = positions.some(pos => {
          const structures = this.getPos(pos.x, pos.y)

          if (structures.length === 0) {
            return false
          }

          if (structures.length === 1 && structures[0] === STRUCTURE_ROAD) {
            return false
          }

          return true
        })

        if (neighborsWillBeAStructure) {
          continue
        }
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
}

