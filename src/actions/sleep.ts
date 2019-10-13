import { Action, ACTIONS_RESULT } from '../core'

export interface ISleepContext {
  sleepFor: number
  wakeAt: number
}

export class Sleep extends Action {
  run(context: ISleepContext): [ACTIONS_RESULT, ...string[]] {
    if (context.wakeAt == null && context.sleepFor == null) {
      return [ACTIONS_RESULT.SHIFT_AND_STOP]
    }

    if (context.wakeAt == null) {
      delete context.sleepFor
      context.wakeAt = Game.time + context.sleepFor
    }

    if (Game.time >= context.wakeAt) {
      delete context.wakeAt
      return [ACTIONS_RESULT.SHIFT_AND_STOP]
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}
