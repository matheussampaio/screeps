import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { CreepContext } from './creep-context'

export class CreepUpgradeController extends Action {
  run(context: CreepContext): [ACTIONS_RESULT, ...string[]] {
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

    if (creep.pos.inRangeTo(controller, 3)) {
      creep.upgradeController(controller)
    } else {
      creep.moveTo(controller)
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}