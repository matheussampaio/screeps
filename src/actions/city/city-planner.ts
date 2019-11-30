import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import * as utils from '../../utils'
import { RectCoordinates, MinCut, Coordinates } from '../../utils/min-cut'
import { ICityContext } from './interfaces'
import { City } from './city'

const _visuals: any = {
  time: 0,
  visual: {}
}

@ActionsRegistry.register
export class CityPlanner extends City {
  run(context: ICityContext) {
    this.context = context

    this.resetMapIfFlag()

    if (this.planner.map == null) {
      this.replan()

      return this.unshiftAndContinue(CityPlannerStructure.name)
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

    return this.sleep(5)
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

      this.setPos(lastPos.x, lastPos.y, [STRUCTURE_CONTAINER])
      this.costMatrix.set(lastPos.x, lastPos.y, Infinity)

      const neighbors = utils.getEmptySpacesAroundPosition(lastPos, { closeToExits: false })
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
          [source.id as string]: {
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

      this.setPos(lastPos.x, lastPos.y, [STRUCTURE_CONTAINER])
      this.costMatrix.set(lastPos.x, lastPos.y, Infinity)

      _.defaultsDeep(this.planner, {
        minerals: {
          [mineral.id as string]: {
            id: mineral.id,
            harvesters: [],
            haulers: [],
            repairs: [],
            containerPos: lastPos,
            distance: result.path.length,
            emptySpaces: utils.getEmptySpacesAroundPosition(mineral.pos).length,
            desiredCarryParts: 0
          }
        }
      })
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

        if (value.length && !value.includes(STRUCTURE_ROAD) && !value.includes(STRUCTURE_LINK) &&!value.includes(STRUCTURE_CONTAINER) && !value.includes(STRUCTURE_EXTRACTOR)) {
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

  private resetMapIfFlag() {
    const flag = Game.flags['reset-map']

    if (flag && flag.room && flag.room.name === this.context.roomName) {
      flag.remove()

      delete this.context.planner.map
    }
  }

  private placeStorage() {
    // place storage in the center
    this.placeStructure(this.center, STRUCTURE_STORAGE, true)

    // place roads around storage
    utils.getEmptySpacesAroundPosition(this.center)
      .forEach(pos => this.setPos(pos.x, pos.y, [STRUCTURE_ROAD]))

    const positions = utils.getEmptySpacesAroundPosition(this.center, { range: 2, closeToExits: false })

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
      const neighbors = utils.getNeighborsPositions(pos, { closeToExits: false })

      queue.push(...neighbors)

      // if it is a border position, skip it
      if (utils.isPositionCloseToExit(pos)) {
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
        const positions = utils.getEmptySpacesAroundPosition(pos, { closeToExits: false })

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

@ActionsRegistry.register
export class CityPlannerStructure extends City {
  run(context: any) {
    this.context = context

    const costMatrix = new PathFinder.CostMatrix()

    // block tiles around controller
    utils.getEmptySpacesAroundPosition(this.controller.pos).forEach(pos => {
      costMatrix.set(pos.x, pos.y, Infinity)
    })

    const sources = this.room.find(FIND_SOURCES)

    // block tiles around sources
    for (const source of sources) {
      utils.getNeighborsPositions(source.pos).forEach(pos => {
        costMatrix.set(pos.x, pos.y, Infinity)
      })

      utils.getEmptySpacesAroundPosition(source.pos).forEach(pos => {
        costMatrix.set(pos.x, pos.y, 5)
      })
    }

    const minerals = this.room.find(FIND_MINERALS)

    // block tiles around minerals and place extractor
    for (const mineral of minerals) {
      utils.getNeighborsPositions(mineral.pos).forEach(pos => {
        costMatrix.set(pos.x, pos.y, Infinity)
      })

      utils.getEmptySpacesAroundPosition(mineral.pos).forEach(pos => {
        costMatrix.set(pos.x, pos.y, 5)
      })
    }

    this.context.planner.targets = [
      { range: 2, x: this.controller.pos.x, y: this.controller.pos.y, roomName: this.room.name },
      ...sources.map(source => ({ range: 2, x: source.pos.x, y: source.pos.y, roomName: source.pos.roomName })),
      ...minerals.map(mineral => ({ range: 2, x: mineral.pos.x, y: mineral.pos.y, roomName: mineral.pos.roomName })),
      this.room.find(FIND_EXIT_TOP),
      this.room.find(FIND_EXIT_RIGHT),
      this.room.find(FIND_EXIT_BOTTOM),
      this.room.find(FIND_EXIT_LEFT)
    ]

    const pos = []
    const terrain = this.room.getTerrain()

    for (let x = 1; x < 49; x++) {
      for (let y = 1; y < 49; y++) {
        if (!(terrain.get(x, y) & TERRAIN_MASK_WALL)) {
          pos.push({ x, y, roomName: this.room.name })
        }
      }
    }

    this.context.planner.targets.push(..._.shuffle(pos))

    this.context.planner.costMatrixSerialized = costMatrix.serialize()

    return this.shiftUnshitAndStop(CityPlannerStructureConsume.name)
  }
}

@ActionsRegistry.register
export class CityPlannerStructureConsume extends City {
  protected structure?: CostMatrix

  run(context: any) {
    this.context = context

    if (_visuals.time != Game.time) {
      _visuals.time = Game.time
      _visuals.visual = {}
    }

    this.structure = PathFinder.CostMatrix.deserialize(this.context.planner.costMatrixSerialized)

    const target = this.getNextTarget()

    this.visualizeCostMatrix(this.structure, this.room)

    if (target == null) {
      if (this.clean(this.structure)) {
        this.context.planner.costMatrixSerialized = this.structure.serialize()

        if (Game.cpu.getUsed() >= 10) {
          return this.waitNextTick()
        } else {
          return this.retry()
        }
      }

      return this.waitNextTick()
      // return this.shiftAndContinue()
    }

    const positions = target.map(({ x, y, roomName }: any) => new RoomPosition(x, y, roomName))
    const range = _.get(target, '[0].range', 0)

    const result = this.search(this.center, positions, this.structure, { range })

    if (!result.incomplete) {
      result.path.unshift(this.center)
      this.markPath(this.structure, result.path, this.room)
      this.visualizePath(result.path, { color: 'green', opacity: 1 })
    } else {
    }

    // this.visualizeCostMatrix(this.structure, this.room)

    this.context.planner.costMatrixSerialized = this.structure.serialize()

    if (Game.cpu.getUsed() >= 10) {
      return this.waitNextTick()
    } else {
      return this.retry()
    }
  }

  private getNextTarget(): { x: number, y: number }[] | null {
    if (!this.context.planner.targets.length) {
      return null
    }

    const target = this.context.planner.targets.shift()

    if (_.isArray(target)) {
      return target
    }

    if (this.structure && !this.structure.get(target.x, target.y)) {
      return [target]
    }

    return this.getNextTarget()
  }

  private search(from: RoomPosition, to: RoomPosition | RoomPosition[], costMatrix: CostMatrix, { range = 0 }: { range?: number } = {}): PathFinderPath {
    const opts: PathFinderOpts = {
      roomCallback: (roomName: string): boolean | CostMatrix => {
        if (roomName === from.roomName) {
          return costMatrix
        }

        return false
      },
      plainCost: 2,
      swampCost: 5
    }

    const positions = _.isArray(to) ? to : [to]

    const goals = positions.map(pos => ({ pos, range }))

    return PathFinder.search(from, goals, opts)
  }

  private visualizePath(pos: RoomPosition[], style?: LineStyle) {
    for (let i = 1; i < pos.length; i++) {
      const from = pos[i - 1]
      const to = pos[i]

      this.room.visual.line(from.x, from.y, to.x, to.y, style)
    }
  }

  private visualizeCostMatrix(costMatrix: CostMatrix, room: Room) {
    room.visual.circle(this.center.x, this.center.y, { fill: 'gree', radius: 0.5, opacity: 1 })

    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const value = costMatrix.get(x, y)

        if (value >= 25) {
          if (_visuals.visual[`c-${x},${y}`] == null) {
            room.visual.circle(x, y, { fill: 'red', radius: 0.5, opacity: 0.3 })
            _visuals.visual[`c-${x},${y}`] = true
          }
        } else if (value === 1) {
          // console.log('found road')
          const neighbors = utils.getNeighborsCoords(x, y)

          neighbors.forEach(coord => {
            const v2 = costMatrix.get(coord.x, coord.y)

            if (v2 === 1) {
              if (_visuals.visual[`l-${x},${y}-${coord.x},${coord.y}`] == null) {
                _visuals.visual[`l-${x},${y}-${coord.x},${coord.y}`] = true

                room.visual.line(x, y, coord.x, coord.y, { color: '#111111', opacity: 0.6 })
              }
            }
          })
        }
      }
    }
  }

  private markPath(costMatrix: CostMatrix, positions: RoomPosition[], room: Room) {
    const terrain = room.getTerrain()

    for (const pos of positions) {
      costMatrix.set(pos.x, pos.y, 1)

      utils.getNeighborsPositions(pos)
        .filter(pos => !(terrain.get(pos.x, pos.y) & TERRAIN_MASK_WALL))
        .filter(pos => costMatrix.get(pos.x, pos.y) === 0)
        .forEach(pos => costMatrix.set(pos.x, pos.y, 25))
    }
  }

  private clean(costMatrix: CostMatrix): boolean {
    const arrowCoordsDx = [
      [[0, 0], [0, -1], [0, 1], [1, 0]],
      [[0, 0], [1, 0], [-1, 0], [0, 1]],
      [[0, 0], [0, 1], [0, -1], [-1, 0]],
      [[0, 0], [-1, 0], [1, 0], [0, -1]],
    ]

    for (let x = 1; x < 49; x++) {
      for (let y = 1; y < 49; y++) {
        const arrow = arrowCoordsDx.some(coords => coords.every(([dx, dy]) => costMatrix.get(x + dx, y + dy) === 1))

        if (arrow) {
          costMatrix.set(x, y, 25)
          this.room.visual.circle(x, y, { fill: 'green', opacity: 1, radius: 0.5 })
          return true
        }
      }
    }

    return false
  }
}
