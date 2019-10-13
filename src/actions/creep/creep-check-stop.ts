import * as _ from 'lodash'

import { Action, Process, ACTIONS_RESULT } from '../../core'
import { ICreepContext } from './interfaces'
import { Sleep, ISleepContext } from '../sleep'

export class CreepCheckStop extends Action {
  run(context: ICreepContext & ISleepContext, process: Process): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    // stop if we lose access to this creep
    if (creep == null) {
      return [ACTIONS_RESULT.HALT]
    }

    // stop if another process owns this room
    if (creep.memory.PID !== process.PID) {
      return [ACTIONS_RESULT.HALT]
    }

    if (creep.getActiveBodyparts(MOVE) === 0) {
      return [ACTIONS_RESULT.HALT]
    }

    if (creep.spawning) {
      return [ACTIONS_RESULT.WAIT_NEXT_TICK_ALL]
    }

    context.sleepFor = 5

    return [ACTIONS_RESULT.SHIFT_AND_CONTINUE, Sleep.name]
  }
}

