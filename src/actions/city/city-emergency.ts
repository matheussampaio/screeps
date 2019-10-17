import * as _ from 'lodash'

import { Action, ACTIONS_RESULT, PRIORITY } from '../../core'
import { CreateBody } from '../../utils/create-body'
import { CreepCheckStop, CreepGeneric } from '../creep'
import { ICityContext } from './interfaces'

export class CityEmergency extends Action {
  run(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    const totalCreepsAlive: number = _.filter(Game.creeps, creep => creep.memory.roomName === context.roomName).length

    if (totalCreepsAlive === 0) {
      context.queue = []

      this.createEmergencyCreep(context)
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  private createEmergencyCreep(context: ICityContext) {
    const room: Room = Game.rooms[context.roomName]
    const body: BodyPartConstant[] = new CreateBody({ minimumEnergy: 300, energyAvailable: room.energyAvailable })
        .add([WORK, CARRY], { repeat: true, withMove: true })
        .value()

    context.queue.push({
      body,
      actions: [[CreepCheckStop.name], [CreepGeneric.name]],
      priority: PRIORITY.VERY_HIGH,
      memory: {}
    })
  }
}

