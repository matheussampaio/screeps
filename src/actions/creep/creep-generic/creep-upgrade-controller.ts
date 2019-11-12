import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../../core'
import { ICreepGenericContext } from './interfaces'

@ActionsRegistry.register
export class CreepUpgradeController extends Action {
  run(context: ICreepGenericContext) {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return this.shiftAndStop()
    }

    if (creep.room.controller && creep.room.controller.level === 8 && CONTROLLER_DOWNGRADE[8] - creep.room.controller.ticksToDowngrade <= 200) {
      return this.shiftAndStop()
    }

    const isEmpty = _.sum(_.values(creep.carry)) === 0

    if (isEmpty) {
      return this.shiftAndContinue()
    }

    const room = Game.rooms[creep.memory.roomName]

    if (room == null) {
      return this.waitNextTick()
    }

    const controller: StructureController | undefined = room.controller

    // we should always find the controler...
    if (controller == null) {
      this.logger.error(`Can't find controller`, context.creepName)
      return this.waitNextTick()
    }

    if (controller.sign == null) {
      const sign = '¯\_(ツ)_/¯'

      if (creep.signController(controller, sign) == ERR_NOT_IN_RANGE) {
        creep.travelTo(controller);
      }

      return this.waitNextTick()
    }

    if (context.rangeToController == null) {
      context.rangeToController = Math.floor(Math.random() * 3) + 1
    }

    if (creep.pos.inRangeTo(controller, context.rangeToController)) {
      creep.upgradeController(controller)
    } else {
      creep.travelTo(controller)
    }

    return this.waitNextTick()
  }
}
