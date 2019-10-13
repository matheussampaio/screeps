import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { ICreepContext } from './interfaces'

export class CreepUpgradeController extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return [ACTIONS_RESULT.SHIFT_AND_STOP]
    }

    const isEmpty = _.sum(_.values(creep.carry)) === 0

    if (isEmpty) {
      return [ACTIONS_RESULT.SHIFT_AND_CONTINUE]
    }

    const controller: StructureController | undefined = creep.room.controller
    // we should always find the controler...
    if (controller == null) {
      this.logger.error(`Can't find controller`, context.creepName)
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (controller.sign == null) {
      const sign = '¯\_(ツ)_/¯'

      if (creep.signController(controller, sign) == ERR_NOT_IN_RANGE) {
        creep.moveTo(controller);
      }

      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (context.rangeToController == null) {
      context.rangeToController = Math.floor(Math.random() * 3) + 1
    }

    if (creep.pos.inRangeTo(controller, context.rangeToController)) {
      creep.upgradeController(controller)
    } else {
      creep.moveTo(controller)
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}
