import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { CreepContext } from './creep-context'

export class CreepGetEnergy extends Action {
  run(context: CreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return [ACTIONS_RESULT.SHIFT_AND_STOP]
    }

    const isFull = _.sum(_.values(creep.carry)) === creep.carryCapacity

    if (isFull) {
      return [ACTIONS_RESULT.SHIFT_AND_CONTINUE]
    }

    if (context.source == null) {
      const closestSource: Source | null = creep.pos.findClosestByPath(FIND_SOURCES)

      if (closestSource == null) {
        this.logger.debug(`Can't find a source to get energy from.`, context.creepName)
        return [ACTIONS_RESULT.WAIT_NEXT_TICK]
      }

      context.source = closestSource.id
    }

    const source: Source | null = Game.getObjectById(context.source)

    // source is gone, try again next tick
    if (source == null) {
      delete context.source
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (creep.pos.isNearTo(source)) {
      creep.harvest(source)
    } else {
      creep.moveTo(source)
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}
