import * as _ from 'lodash'

import { Action, ACTIONS_RESULT, Process } from '../../core'
import { CreepGetEnergy } from './creep-get-energy'
import { CreepHauler } from './creep-hauler'
import { ICreepContext } from './interfaces'

export class CreepGeneric extends Action {
  run(context: ICreepContext, process: Process): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

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
