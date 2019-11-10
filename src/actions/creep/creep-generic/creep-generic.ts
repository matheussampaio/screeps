import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../../core'
import { CreepGetEnergy } from './creep-get-energy'
import { CreepHauler } from './creep-hauler'
import { ICreepGenericContext } from './interfaces'

@ActionsRegistry.register
export class CreepGeneric extends Action {
  run(context: ICreepGenericContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep.spawning) {
      return this.waitNextTick()
    }

    const isEmpty = _.sum(_.values(creep.carry)) === 0

    if (isEmpty) {
      return this.unshiftAndContinue(CreepGetEnergy.name)
    }

    return this.unshiftAndContinue(CreepHauler.name)
  }
}
