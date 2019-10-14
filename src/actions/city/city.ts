import * as _ from 'lodash'

import { Action, ACTIONS_RESULT, PRIORITY } from '../../core'
import { CreepCheckStop, CreepHarvester, CreepSingleHauler, CreepGeneric } from '../creep'
import { CreateBody } from '../../utils/create-body'
// import { Sleep } from '../sleep'
import { ICityContext, IPlanSource, ISpawnerItem } from './interfaces'
import { getUniqueCreepName } from '../../utils'

// With 6 WORK parts, a creep can farm 3600 in 300 ticks (6 * 2 * 300).
// It's more than enough to farm a 3k source.
const OPTIMUM_WORK_PARTS_PER_SOURCE = 6

export class City extends Action {
  run(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    _.defaults(context, {
      queue: [],
      plan: {}
    })

    const room: Room = Game.rooms[context.roomName]

    if (context.plan.energyCapacity !== room.energyCapacityAvailable) {
      this.plan(context)
    }

    if (context.queue.length) {
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    for (const source of context.plan.sources) {
      source.harvesters = source.harvesters.filter(creepName => Game.creeps[creepName] != null)
      source.haulers = source.haulers.filter(creepName => Game.creeps[creepName] != null)

      const currentWorkParts: number = Math.min(OPTIMUM_WORK_PARTS_PER_SOURCE, this.getActiveBodyParts(source.harvesters, WORK))
      const currentCarryParts: number = this.getActiveBodyParts(source.haulers, CARRY)

      // While the Hauler is traveling from source to storage and back, the
      // Harvester should produce: WORK_PARTS * HARVEST_POWER * DISTANCE * 2
      // Our Haulers should have enough CARRY parts to carry all that energy.
      const energyProduced = source.distance * currentWorkParts * HARVEST_POWER * 2

      source.desiredCarryParts = energyProduced / CARRY_CAPACITY

      if (currentCarryParts * CARRY_CAPACITY < energyProduced) {
        const memory = { source: source.id }
        const creepName = this.createHaulers(context, memory)

        source.haulers.push(creepName)

        return [ACTIONS_RESULT.WAIT_NEXT_TICK]
      }

      if (source.harvesters.length < source.emptySpaces && currentWorkParts < source.desiredWorkParts) {
        const memory = { source: source.id }
        const creepName = this.createHarvester(context, memory)

        source.harvesters.push(creepName)

        return [ACTIONS_RESULT.WAIT_NEXT_TICK]
      }

      // TODO: queue container construction site
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  private createHaulers(context: ICityContext, memory: any): string {
    const room: Room = Game.rooms[context.roomName]

    const creepName = getUniqueCreepName()

    context.queue.push({
      memory,
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: room.energyCapacityAvailable })
       .add([MOVE, CARRY, MOVE, WORK])
       .add([CARRY], { withMove: true, repeat: true })
       .value(),
      actions: [[CreepCheckStop.name], [CreepSingleHauler.name]],
      priority: PRIORITY.NORMAL
    })

    return creepName
  }

  private createHarvester(context: ICityContext, memory: any): string {
    const room: Room = Game.rooms[context.roomName]

    const creepName = getUniqueCreepName()

    context.queue.push({
      memory,
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: room.energyCapacityAvailable })
        .add([MOVE, CARRY, WORK, WORK, WORK, WORK, WORK, WORK])
        .add([MOVE, MOVE, MOVE, MOVE, MOVE, MOVE])
        .value(),
      actions: [[CreepCheckStop.name], [CreepHarvester.name]],
      priority: PRIORITY.NORMAL,
    })

    return creepName
  }

  private plan(context: ICityContext): void {
    this.logger.info('Planning...')

    const room: Room = Game.rooms[context.roomName]

    context.plan.energyCapacity = room.energyCapacityAvailable

    if (context.plan.sources == null) {
      const spawn: StructureSpawn | undefined = _.sample(room.find(FIND_MY_SPAWNS))

      context.plan.sources = room.find(FIND_SOURCES).map((source: Source) => ({
        id: source.id,
        harvesters: [],
        haulers: [],
        container: null,
        distance: spawn ? source.pos.findPathTo(spawn).length : Infinity,
        emptySpaces: this.getEmptySpacesAroundPosition(source.pos),
        desiredWorkParts: 0,
        desiredCarryParts: 0
      }))

      context.plan.sources.sort((s1: any, s2: any) => s1.distance - s2.distance)
    }

    const maxWorkPartAllowedByEnergyCapacity = this.getMaxWorkPartAllowedByEnergyCapacity(context)

    for (const source of context.plan.sources) {
      const desiredWorkParts = Math.min(OPTIMUM_WORK_PARTS_PER_SOURCE, maxWorkPartAllowedByEnergyCapacity * source.emptySpaces)

      source.desiredWorkParts = desiredWorkParts
    }
  }

  private getEmptySpacesAroundPosition(pos: RoomPosition): number {
    const positions = this.getNeighborsPositions(pos)

    const terrain: RoomTerrain = new Room.Terrain(pos.roomName)

    const TERRAIN_MASK_PLAIN = 0

    return positions.map(p => terrain.get(p.x, p.y))
      .filter(t => t === TERRAIN_MASK_SWAMP || t === TERRAIN_MASK_PLAIN)
      .length
  }

  private getNeighborsPositions(pos: RoomPosition): RoomPosition[] {
    const cords: [number, number][] = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0],          [1,  0],
      [-1,  1], [0,  1], [1,  1]
    ]

    const room: Room = Game.rooms[pos.roomName]

    const positions = cords
      .map(([dx, dy]) => ([pos.x - dx, pos.y - dy]))
      .map(([x, y]) => room.getPositionAt(x, y))
      .filter(p => p != null) as RoomPosition[]

    return positions
  }

  private getActiveBodyParts(names: string[], part: BodyPartConstant): number {
    const creeps: Creep[] = this.getCreepsFromName(names)

    const activeParts: number[] = creeps.map(creep => creep.getActiveBodyparts(part))

    return _.sum(activeParts)
  }

  private getCreepsFromName(names: string[]): Creep[] {
    return names
      .map(name => Game.creeps[name])
      .filter(creep => creep != null)
  }

  private getMaxWorkPartAllowedByEnergyCapacity(context: ICityContext): number {
    const room: Room = Game.rooms[context.roomName]

    const maximumWorkerParts: number = Math.floor((room.energyCapacityAvailable - BODYPART_COST[MOVE] - BODYPART_COST[CARRY]) / BODYPART_COST[WORK])

    return maximumWorkerParts
  }
}
