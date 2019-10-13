import * as _ from 'lodash'

import { Action, ACTIONS_RESULT, PRIORITY } from '../../core'
import { CreepCheckStop, CreepHarvester, CreepSingleHauler, CreepGeneric } from '../creep'
import { CreateBody } from '../../utils/create-body'
import { Sleep } from '../sleep'
import { ICityContext, IPlanSource, ISpawnerItem } from './interfaces'
import { getUniqueCreepName } from '../../utils'

const MIN_CREEP_PER_ROOM = 4
const MAX_CREEP_PER_ROOM = 8
const MINIMUM_ENERGY_FOR_SINGLE_PURPOSE_CREEPS = 700

export class City extends Action {
  run(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    _.defaults(context, {
      queue: []
    })

    const room = Game.rooms[context.roomName]

    const creepNumberInThisRoom = this.getTotalCreepInRoom(context, room)
    const isEmergency = creepNumberInThisRoom < MIN_CREEP_PER_ROOM

    // enable single purpose creeps after we can build creeps large enough (700
    // energy)
    if (!isEmergency && room.energyCapacityAvailable > MINIMUM_ENERGY_FOR_SINGLE_PURPOSE_CREEPS) {
      return this.singlePurposeCreeps(context)
    }

    return this.multiPurposeCreeps(context)
  }

  private singlePurposeCreeps(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    if (context.plan == null) {
      this.plan(context)
    }

    const room: Room = Game.rooms[context.roomName]
    const sources: IPlanSource[] = context.plan.sources

    for (const source of sources) {
      if (source.harvester == null || !this.creepExists(context, source.harvester)) {
        const creepName = getUniqueCreepName()

        context.queue.push({
          body: new CreateBody({ minimumEnergy: 700, energyAvailable: room.energyCapacityAvailable })
            .add([MOVE, CARRY, WORK, WORK, WORK, WORK, WORK, WORK])
            .add([MOVE, MOVE, MOVE, MOVE, MOVE, MOVE])
            .value(),
          actions: [[CreepCheckStop.name], [CreepHarvester.name]],
          priority: PRIORITY.NORMAL,
          memory: {
            source: source.id
          },
          creepName
        })

        source.harvester = creepName
      }

      if (source.hauler == null || !this.creepExists(context, source.hauler)) {
        const creepName = getUniqueCreepName()

        context.queue.push({
          body: new CreateBody({ minimumEnergy: 400, energyAvailable: room.energyAvailable })
           .add([CARRY], { withMove: true, repeat: true })
           .value(),
          actions: [[CreepCheckStop.name], [CreepSingleHauler.name]],
          priority: PRIORITY.NORMAL,
          memory: {
            source: source.id
          },
          creepName
        })

        source.hauler = creepName
      }
    }

    context.sleepFor = 5

    return [ACTIONS_RESULT.UNSHIFT_AND_CONTINUE, Sleep.name]
  }

  private plan(context: ICityContext): void {
    this.logger.info('Planning...')
    context.plan = {
      sources: []
    }

    const room: Room = Game.rooms[context.roomName]

    const spawn: StructureSpawn | undefined = _.sample(room.find(FIND_MY_SPAWNS))

    context.plan.sources = room.find(FIND_SOURCES).map((source: Source) => ({
      id: source.id,
      harvester: null,
      hauler: null,
      // @FIXME: If we can't find a Spawn, we should look for something else
      // to define the distance to the our base
      distance: spawn ? source.pos.findPathTo(spawn).length : Infinity
    }))

    context.plan.sources.sort((s1: any, s2: any) => s1.distance - s2.distance)
  }

  private multiPurposeCreeps(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    const room = Game.rooms[context.roomName]

    const creepNumberInThisRoom = this.getTotalCreepInRoom(context, room)
    const isEmergency = creepNumberInThisRoom < MIN_CREEP_PER_ROOM

    // I don't want to queue all the creeps at the same time. To avoid having
    // items in the queue for way to long. Sometimes it's interesting to change
    // creeps size and numbers, we need to clear the queue and replan
    if (context.queue.length || creepNumberInThisRoom >= MAX_CREEP_PER_ROOM) {
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    const minimumEnergy = isEmergency ? SPAWN_ENERGY_CAPACITY : room.energyCapacityAvailable

    const body = this.getGenericCreepBody(minimumEnergy, room)

    context.queue.push({
      body,
      actions: [[CreepCheckStop.name], [CreepGeneric.name]],
      priority: PRIORITY.NORMAL,
      memory: {}
    } as ISpawnerItem)

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  private getTotalCreepInRoom(context: ICityContext, room: Room): number {
    const totalCreepsAlive: number = _.filter(Game.creeps, creep => creep.memory.roomName === room.name).length
    const totalCreepsToBeCreated: number = context.queue.length

    return totalCreepsAlive + totalCreepsToBeCreated
  }

  private getGenericCreepBody(minimumEnergy: number, room: Room): BodyPartConstant[] {
    const body = new CreateBody({ minimumEnergy, energyAvailable: room.energyAvailable })
      .add([WORK, CARRY], { repeat: true, withMove: true })
      .value()

    return body
  }

  private creepExists(context: ICityContext, creepName: string): boolean {
    if (Game.creeps[creepName]) {
      return true
    }

    return context.queue.some((item: ISpawnerItem) => item.creepName === creepName)
  }
}
