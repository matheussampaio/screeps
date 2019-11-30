import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import * as utils from '../../utils'
import { RectCoordinates, MinCut, Coordinates } from '../../utils/min-cut'
import { City } from './city'

@ActionsRegistry.register
export class CityPlanner extends City {
  protected skeleton?: CostMatrix

  run(context: any) {
    this.context = context

    this.resetMapIfFlag()

    if (this.planner.map == null) {
      return this.unshiftAndContinue(CityPlannerStructure.name, CityPlannerCreate.name)
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

      this.calculateBestUpgraderBody()
    }

    return this.waitNextTick()
  }

  private calculateBestUpgraderBody(): void {
    // best upgraders body
    const goal = this.room.find(FIND_MY_SPAWNS).map(source => source.pos)
    const distance = PathFinder.search(this.controller.pos, goal).path.length
    const permutations = this.generatePermutations(this.room.energyCapacityAvailable, distance / 3)

    let bestEntry: string = ''
    let bestEficiency = 0

    for (const key in permutations) {
      const eficiency = permutations[key]

      if (eficiency > bestEficiency) {
        bestEficiency = eficiency
        bestEntry = key
      }
    }

    this.upgradersBody = bestEntry.split(',') as BodyPartConstant[]

    const positions = [
      this.planner.storageLinkPos,
      ...this.sources.sort((a, b) => b.distance - a.distance).map(s => s.linkPos)
    ]

    for (let i = 0; i < CONTROLLER_STRUCTURES[STRUCTURE_LINK][this.controller.level]; i++) {
      if (!positions.length) {
        break
      }

      const hasPos = positions.shift() as { x: number, y: number }

      const link = this.findLink(hasPos)

      if (link == null) {
        const pos = this.room.getPositionAt(hasPos.x, hasPos.y) as RoomPosition

        this.room.createConstructionSite(pos, STRUCTURE_LINK)

        break
      }
    }
  }

  private generatePermutations(energy: number, distance: number) {
    const parts: BodyPartConstant[] = [MOVE, CARRY, WORK]
    const perms: { [key: string]: number } = {}

    const queue: { energy: number, body: BodyPartConstant[] }[] = [{
      energy: energy - (BODYPART_COST[MOVE] + BODYPART_COST[CARRY] + BODYPART_COST[WORK]),
      body: [MOVE, CARRY, WORK]
    }]

    while (queue.length) {
      const item = queue.shift()

      if (item == null) {
        continue
      }

      this.addPermutation(perms, item.body, distance)

      if (item.body.length >= MAX_CREEP_SIZE) {
        continue
      }

      for (const part of parts) {
        const cost = BODYPART_COST[part]

        if (cost <= item.energy) {
          const body = [...item.body, part]

          if (this.addPermutation(perms, body, distance)) {
            queue.push({ energy: item.energy - cost, body })
          }
        }
      }
    }

    return perms
  }

  private addPermutation(perms: { [key: string]: number }, body: BodyPartConstant[], distance: number): boolean {
    const work = body.filter(p => p === WORK).length
    const move = body.filter(p => p === MOVE).length
    const carry = body.filter(p => p === CARRY).length

    const index = body.sort().join()

    if (perms[index] != null) {
      return false
    }

    perms[index] = this.calculateEficiency({
      distance,
      work,
      move,
      carry
    })

    return true
  }

  private calculateEficiency({ distance, work, move, carry }: { distance: number, work: number, move: number, carry: number }): number {
    if (!move || !carry || !work) {
      return 0
    }

    const ticksToArriveAtController = (distance - 3) * Math.ceil(work / move)
    const ticksGettingEnergy = 1500 / (Math.floor(carry * 50 / work) + 1)

    return (1500 - ticksToArriveAtController - ticksGettingEnergy) * work
  }

  private resetMapIfFlag() {
    const flag = Game.flags['reset-map']

    if (flag && flag.room && flag.room.name === this.context.roomName) {
      flag.remove()

      delete this.context.planner.map
    }
  }
}


@ActionsRegistry.register
export class CityPlannerCreate extends CityPlanner {
  run(context: any) {
    this.context = context

    const costMatrix = new PathFinder.CostMatrix()

    this.planner.plannedAt = Game.time
    this.skeleton = PathFinder.CostMatrix.deserialize(this.context.planner.skeletonCostMatrix)

    // block tiles around spawners
    const spawns = this.room.find(FIND_MY_SPAWNS)

    for (const spawn of spawns) {
      this.setPos(costMatrix, spawn.pos.x, spawn.pos.y, [STRUCTURE_SPAWN])

      utils.getEmptySpacesAroundPosition(spawn.pos).forEach(pos => {
        this.setPos(costMatrix, pos.x, pos.y, [STRUCTURE_ROAD])
      })
    }

    const sources = this.room.find(FIND_SOURCES)

    this.placeStorage(costMatrix)

    // block and plan roads to sources
    for (const source of sources) {
      const result = this.search(source.pos, costMatrix)

      if (result.incomplete) {
        continue
      }

      for (const pos of result.path.slice(1, result.path.length - 1)) {
        this.setPos(costMatrix, pos.x, pos.y, [STRUCTURE_ROAD])
      }

      const lastPos = result.path[result.path.length - 1] as RoomPosition

      this.setPos(costMatrix, lastPos.x, lastPos.y, [STRUCTURE_CONTAINER])
      costMatrix.set(lastPos.x, lastPos.y, Infinity)

      const neighbors = utils.getEmptySpacesAroundPosition(lastPos, { closeToExits: false })
      let linkPos

      for (const neighbor of neighbors) {
        if (this.getPos(neighbor.x, neighbor.y).length === 0) {
          this.setPos(costMatrix, neighbor.x, neighbor.y, [STRUCTURE_LINK])
          linkPos = neighbor
          break
        }
      }

      _.defaultsDeep(this.planner, {
        sources: {
          [source.id as string]: {
            id: source.id,
            harvesters: [],
            haulers: [],
            desiredWorkParts: 0,
            desiredCarryParts: 0
          }
        }
      })

      const id = source.id as string

      this.planner.sources[id].linkPos = linkPos
      this.planner.sources[id].containerPos = lastPos
      this.planner.sources[id].distance = result.path.length
      this.planner.sources[id].emptySpaces = utils.getEmptySpacesAroundPosition(source.pos).length
    }

    const minerals = this.room.find(FIND_MINERALS)

    // block and plan roads to minerals
    for (const mineral of minerals) {
      const result = this.search(mineral.pos, costMatrix)

      if (result.incomplete) {
        continue
      }

      for (const pos of result.path.slice(1, result.path.length - 1)) {
        this.setPos(costMatrix, pos.x, pos.y, [STRUCTURE_ROAD])
      }

      const lastPos = result.path[result.path.length - 1] as RoomPosition

      this.setPos(costMatrix, lastPos.x, lastPos.y, [STRUCTURE_CONTAINER])
      costMatrix.set(lastPos.x, lastPos.y, Infinity)

      _.defaultsDeep(this.planner, {
        minerals: {
          [mineral.id as string]: {
            id: mineral.id,
            harvesters: [],
            haulers: [],
            repairs: [],
            desiredCarryParts: 0
          }
        }
      })

      const id = mineral.id as string

      this.planner.minerals[id].containerPos = lastPos
      this.planner.minerals[id].distance = result.path.length
      this.planner.minerals[id].emptySpaces = utils.getEmptySpacesAroundPosition(mineral.pos).length
    }

    const exits = [
      FIND_EXIT_TOP,
      FIND_EXIT_RIGHT,
      FIND_EXIT_BOTTOM,
      FIND_EXIT_LEFT
    ]

    // block and plan roads to exits
    for (const exit of exits) {
      const exitPosition = this.room.find(exit)

      if (exitPosition == null) {
        continue
      }

      const result = this.search(exitPosition, costMatrix, 1)

      if (result.incomplete) {
        continue
      }

      for (const pos of result.path.slice(1)) {
        this.setPos(costMatrix, pos.x, pos.y, [STRUCTURE_ROAD])
      }
    }

    this.placeSpawners(costMatrix)

    this.placeStructureType(costMatrix, STRUCTURE_TOWER)

    this.placeStructureType(costMatrix, STRUCTURE_TERMINAL)

    this.placeStructureType(costMatrix, STRUCTURE_EXTENSION)

    this.pruneExtraRoads(costMatrix)

    this.placeWallsAndRamparts(costMatrix)

    this.placeExtractors(costMatrix)

    delete this.planner.skeletonCostMatrix

    this.planner.costMatrix = costMatrix.serialize()

    return this.shiftAndStop()
  }

  private pruneExtraRoads(costMatrix: CostMatrix) {
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
          costMatrix.set(x, y, 0)
          this.map[y * 50 + x] = []
        }
      }
    }
  }

  protected clean(costMatrix: CostMatrix): { x: number, y: number } | null {
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
          return { x, y }
        }
      }
    }

    return null
  }

  private placeSpawners(costMatrix: CostMatrix) {
    const spawners = this.room.find(FIND_MY_SPAWNS)

    for (let i = spawners.length; i < CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][8]; i++) {
      const pos = this.findSuitablePlaceForStructure(costMatrix, STRUCTURE_SPAWN)

      if (pos == null) {
        break
      }

      // place roads around spawner
      utils.getEmptySpacesAroundPosition(pos)
        .forEach(pos => this.setPos(costMatrix, pos.x, pos.y, [STRUCTURE_ROAD]))

      this.placeStructure(costMatrix, pos, STRUCTURE_SPAWN)
    }
  }

  private placeExtractors(costMatrix: CostMatrix) {
    const minerals = this.room.find(FIND_MINERALS)

    for (let i = 0; i < CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][8]; i++) {
      const mineral = minerals.shift()

      if (mineral == null) {
        break
      }

      this.placeStructure(costMatrix, mineral.pos, STRUCTURE_EXTRACTOR)
    }
  }

  private placeWallsAndRamparts(costMatrix: CostMatrix) {
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
        this.setPos(costMatrix, pos.x, pos.y, [STRUCTURE_WALL])
      } else {
        this.setPos(costMatrix, pos.x, pos.y, [...value, STRUCTURE_RAMPART], true)
      }
    }
  }

  private placeStorage(costMatrix: CostMatrix) {
    // place storage in the center
    this.placeStructure(costMatrix, this.center, STRUCTURE_STORAGE, true)

    // place roads around storage
    utils.getEmptySpacesAroundPosition(this.center)
      .forEach(pos => this.setPos(costMatrix, pos.x, pos.y, [STRUCTURE_ROAD]))

    const positions = utils.getEmptySpacesAroundPosition(this.center, { range: 2, closeToExits: false })

    // place link close to storage
    for (const pos of positions) {
      const structures = this.getPos(pos.x, pos.y)

      if (structures.length === 0 && this.skeleton!.get(pos.x, pos.y) === 25) {
        this.planner.storageLinkPos = pos
        this.setPos(costMatrix, pos.x, pos.y, [STRUCTURE_LINK])
        break
      }
    }
  }

  private placeStructureType(costMatrix: CostMatrix, structureType: BuildableStructureConstant) {
    for (let i = 0; i < CONTROLLER_STRUCTURES[structureType][8]; i++) {
      const pos = this.findSuitablePlaceForStructure(costMatrix, structureType)

      if (pos == null) {
        break
      }

      this.placeStructure(costMatrix, pos, structureType)
    }
  }

  private findSuitablePlaceForStructure(costMatrix: CostMatrix, structureType: BuildableStructureConstant): RoomPosition | null {
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

      if (this.skeleton!.get(pos.x, pos.y) !== 25) {
        continue
      }

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
      if (costMatrix.get(pos.x, pos.y) >= 50) {
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
      if (neighbors.find(p => this.skeleton!.get(p.x, p.y) === 1)) {
        return pos
      }
    }

    return null
  }

  private placeStructure(costMatrix: CostMatrix, pos: RoomPosition, structureType: BuildableStructureConstant, force: boolean = false) {
    this.setPos(costMatrix, pos.x, pos.y, [structureType], force)
  }

  protected setPos(costMatrix: CostMatrix, x: number, y: number, value: BuildableStructureConstant[], force: boolean = false) {
    const idx = y * 50 + x

    if (this.map[idx].length === 0 || force) {
      this.map[y * 50 + x] = value
      costMatrix.set(x, y, value.includes(STRUCTURE_ROAD) ? 1 : Infinity)
    }
  }
}

@ActionsRegistry.register
export class CityPlannerStructure extends CityPlanner {
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
      { range: 1, x: this.controller.pos.x, y: this.controller.pos.y, roomName: this.room.name },
      ...sources.map(source => ({ range: 1, x: source.pos.x, y: source.pos.y, roomName: source.pos.roomName })),
      ...minerals.map(mineral => ({ range: 1, x: mineral.pos.x, y: mineral.pos.y, roomName: mineral.pos.roomName })),
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

    this.context.planner.skeletonCostMatrix = costMatrix.serialize()

    return this.shiftUnshitAndStop(CityPlannerStructureConsume.name)
  }
}

@ActionsRegistry.register
export class CityPlannerStructureConsume extends CityPlannerCreate {
  run(context: any) {
    this.context = context

    this.skeleton = PathFinder.CostMatrix.deserialize(this.context.planner.skeletonCostMatrix)

    const target = this.getNextTarget()

    if (target == null) {
      if (this.clean(this.skeleton)) {
        this.context.planner.skeletonCostMatrix = this.skeleton.serialize()

        return this.retry()
      }

      return this.shiftAndContinue()
    }

    const positions = target.map(({ x, y, roomName }: any) => new RoomPosition(x, y, roomName))
    const range = _.get(target, '[0].range', 0)

    const result = this.searchInCostMatrix(this.center, positions, this.skeleton, { range })

    if (!result.incomplete) {
      result.path.unshift(this.center)
      this.markPath(this.skeleton, result.path, this.room)
    }

    this.context.planner.skeletonCostMatrix = this.skeleton.serialize()

    return this.retry()
  }

  private getNextTarget(): { x: number, y: number }[] | null {
    if (!this.context.planner.targets.length) {
      return null
    }

    const target = this.context.planner.targets.shift()

    if (_.isArray(target)) {
      return target
    }

    if (this.skeleton && !this.skeleton.get(target.x, target.y)) {
      return [target]
    }

    return this.getNextTarget()
  }

  private searchInCostMatrix(from: RoomPosition, to: RoomPosition | RoomPosition[], costMatrix: CostMatrix, { range = 0 }: { range?: number } = {}): PathFinderPath {
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
}
