import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { CreepGetEnergy } from './creep-get-energy'
import { CreepUpgradeController } from './creep-upgrade-controller'
import { CreepHauler } from './creep-hauler'
import { CreepContext } from './creep-context'

export class CreepGeneric extends Action {
  run(context: CreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return [ACTIONS_RESULT.HALT]
    }

    if (creep.spawning) {
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    const isEmpty = _.sum(_.values(creep.carry)) === 0

    if (isEmpty) {
      return [ACTIONS_RESULT.UNSHIFT_AND_CONTINUE, CreepGetEnergy.name]
    }

    return [ACTIONS_RESULT.UNSHIFT_AND_CONTINUE, CreepHauler.name]
  }
}
