import * as _ from 'lodash'

import { Action, ACTIONS_RESULT, PRIORITY } from '../../core'
import { CreepCheckStop, CreepHarvester, CreepSingleHauler  } from '../creep'
import { CreateBody } from '../../utils/create-body'
import { ICityContext } from './interfaces'
import * as utils from '../../utils'
import { CreepSingleUpgrader } from '../creep/creep-single-upgrader'
import { CreepSingleBuilder } from '../creep/creep-single-builder'

// With 6 WORK parts, a creep can farm 3600 in 300 ticks (6 * 2 * 300).
// It's more than enough to farm a 3k source.
const OPTIMUM_WORK_PARTS_PER_SOURCE = 6

export class City extends Action {
  run(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    _.defaultsDeep(context, {
      queue: [],
      plan: {
        upgraders: [],
        builders: []
      }
    })

    const room: Room = Game.rooms[context.roomName]

    if (context.plan.energyCapacity !== room.energyCapacityAvailable) {
      this.plan(context)
    }

    if (context.queue.length) {
      return this.waitNextTick()
    }

    for (const source of context.plan.sources) {
      source.harvesters = source.harvesters.filter(creepName => Game.creeps[creepName] != null)
      source.haulers = source.haulers.filter(creepName => Game.creeps[creepName] != null)

      const currentWorkParts: number = Math.min(OPTIMUM_WORK_PARTS_PER_SOURCE, utils.getActiveBodyPartsFromName(source.harvesters, WORK))
      const currentCarryParts: number = utils.getActiveBodyPartsFromName(source.haulers, CARRY)

      // While the Hauler is traveling from source to storage and back, the
      // Harvester should produce: WORK_PARTS * HARVEST_POWER * DISTANCE * 2
      // Our Haulers should have enough CARRY parts to carry all that energy.
      const energyProduced = source.distance * currentWorkParts * HARVEST_POWER * 2

      source.desiredCarryParts = energyProduced / CARRY_CAPACITY

      if (currentCarryParts * CARRY_CAPACITY < energyProduced) {
        const memory = { source: source.id }
        const creepName = this.createHaulers(context, memory)

        source.haulers.push(creepName)

        return this.waitNextTick()
      }

      if (source.harvesters.length < source.emptySpaces && currentWorkParts < source.desiredWorkParts) {
        const memory = { source: source.id }
        const creepName = this.createHarvester(context, memory)

        source.harvesters.push(creepName)

        return this.waitNextTick()
      }

      // TODO: queue container construction site
    }

    context.plan.upgraders = context.plan.upgraders.filter(creepName => Game.creeps[creepName] != null)

    if (context.plan.upgraders.length === 0) {
      const creepName = this.createUpgrader(context)

      context.plan.upgraders.push(creepName)

      return this.waitNextTick()
    }

    context.plan.builders = context.plan.builders.filter(creepName => Game.creeps[creepName] != null)

    if (context.plan.builders.length === 0 && room.find(FIND_MY_CONSTRUCTION_SITES).length) {
      const creepName = this.createBuilder(context)

      context.plan.builders.push(creepName)

      return this.waitNextTick()
    }


    return this.waitNextTick()
  }

  private createBuilder(context: ICityContext): string {
    const room: Room = Game.rooms[context.roomName]

    const creepName = utils.getUniqueCreepName()

    context.queue.push({
      memory: {},
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: room.energyCapacityAvailable })
       .add([CARRY, WORK], { withMove: true, repeat: true })
       .value(),
      actions: [[CreepCheckStop.name], [CreepSingleBuilder.name]],
      priority: PRIORITY.NORMAL
    })

    return creepName
  }

  private createUpgrader(context: ICityContext): string {
    const room: Room = Game.rooms[context.roomName]

    const creepName = utils.getUniqueCreepName()

    context.queue.push({
      memory: {},
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: room.energyCapacityAvailable })
       .add([CARRY, WORK], { withMove: true, repeat: true })
       .value(),
      actions: [[CreepCheckStop.name], [CreepSingleUpgrader.name]],
      priority: PRIORITY.NORMAL
    })

    return creepName
  }

  private createHaulers(context: ICityContext, memory: any): string {
    const room: Room = Game.rooms[context.roomName]

    const creepName = utils.getUniqueCreepName()

    context.queue.push({
      memory,
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: room.energyCapacityAvailable })
       // .add([MOVE, CARRY, MOVE, WORK])
       .add([CARRY], { withMove: true, repeat: true })
       .value(),
      actions: [[CreepCheckStop.name], [CreepSingleHauler.name]],
      priority: PRIORITY.NORMAL
    })

    return creepName
  }

  private createHarvester(context: ICityContext, memory: any): string {
    const room: Room = Game.rooms[context.roomName]

    const creepName = utils.getUniqueCreepName()

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
        emptySpaces: utils.getEmptySpacesAroundPosition(source.pos),
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

  private getMaxWorkPartAllowedByEnergyCapacity(context: ICityContext): number {
    const room: Room = Game.rooms[context.roomName]

    const maximumWorkerParts: number = Math.floor((room.energyCapacityAvailable - BODYPART_COST[MOVE] - BODYPART_COST[CARRY]) / BODYPART_COST[WORK])

    return maximumWorkerParts
  }
}
