import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { ICreepContext } from './interfaces'

export class CreepHarvester extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep = Game.creeps[context.creepName]
    const source: Source | null = Game.getObjectById(context.source)

    if (source == null) {
      this.logger.error(`CreepHarvester:${context.creepName}: source does not exists`)

      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (!creep.pos.isNearTo(source)) {
      creep.moveTo(source)
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (source.energy) {
      creep.harvest(source)
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}
