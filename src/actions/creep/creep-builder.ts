import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { CreepContext } from './creep-context'
import { CreepUpgradeController } from './creep-upgrade-controller'

export class CreepBuilder extends Action {
  run(context: CreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return [ACTIONS_RESULT.SHIFT_AND_STOP]
    }

    const isEmpty = _.sum(_.values(creep.carry)) === 0

    if (isEmpty) {
      return [ACTIONS_RESULT.SHIFT_AND_CONTINUE]
    }

    const target: any = this.getConstructionTarget(creep, context)

    if (target == null) {
      this.logger.debug(`Can't find a construction target, trying to upgrade contoler.`, context.creepName)
      return [ACTIONS_RESULT.SHIFT_UNSHIFT_AND_CONTINUE, CreepUpgradeController.name]
    }

    if (creep.pos.inRangeTo(target, 3)) {
      creep.build(target)
    } else {
      creep.moveTo(target)
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  getConstructionTarget(creep: Creep, context: CreepContext): any {
    if (context.target) {
      const target: any = Game.getObjectById(context.target)

      if (target) {
        return target
      }
    }

    const targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES).sort((c1, c2) => c2.progress - c1.progress);

    if (targets.length === 0) {
      return null
    }

    context.target = targets[0].id

    return targets[0]
  }
}


