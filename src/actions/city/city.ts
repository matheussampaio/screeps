import * as _ from 'lodash'

import { Action, ACTIONS_RESULT, PRIORITY } from '../../core'
import { CreepCheckStop, CreepGeneric } from '../creep'
import { CreateBody } from '../../utils/create-body'
import { ICityContext } from './interfaces'

const MIN_CREEP_PER_ROOM = 4
const MAX_CREEP_PER_ROOM = 8
const MINIMUM_ENERGY_FOR_SINGLE_PURPOSE_CREEPS = 700

export class City extends Action {
  run(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    _.defaults(context, {
      queue: []
    })

    const room = Game.rooms[context.roomName]

    if (room.energyCapacityAvailable > MINIMUM_ENERGY_FOR_SINGLE_PURPOSE_CREEPS) {
      return this.singlePurposeCreeps(context)
    }

    return this.multiPurposeCreeps(context)
  }

  singlePurposeCreeps(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    this.logger.info('Single Purpose Creeps!')
    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  multiPurposeCreeps(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    this.logger.info('Multi Purpose Creeps!')
    const room = Game.rooms[context.roomName]

    const creepNumberInThisRoom = this.getTotalCreepInRoom(context, room)

    // I don't want to queue all the creeps at the same time. To avoid having
    // items in the queue for way to long. Sometimes it's interesting to change
    // creeps size and numbers, we need to clear the queue and replan
    if (context.queue.length || creepNumberInThisRoom >= MAX_CREEP_PER_ROOM) {
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    const isEmergency = creepNumberInThisRoom < MIN_CREEP_PER_ROOM
    const minimumEnergy = isEmergency ? SPAWN_ENERGY_CAPACITY : room.energyCapacityAvailable

    const body = this.getGenericCreepBody(minimumEnergy, room)

    context.queue.push({
      body,
      minimumEnergy,
      actions: [[CreepCheckStop.name], [CreepGeneric.name]],
      priority: PRIORITY.NORMAL,
      memory: {}
    })

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  getTotalCreepInRoom(context: ICityContext, room: Room): number {
    const totalCreepsAlive: number = _.filter(Game.creeps, creep => creep.memory.roomName === room.name).length
    const totalCreepsToBeCreated: number = context.queue.length

    return totalCreepsAlive + totalCreepsToBeCreated
  }

  getGenericCreepBody(minimumEnergy: number, room: Room): BodyPartConstant[] {
    const body = new CreateBody({ minimumEnergy, energyAvailable: room.energyAvailable })
      .add([WORK, CARRY], { repeat: true, withMove: true })
      .value()

    return body
  }
}
