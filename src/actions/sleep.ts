import { Action, ACTIONS_RESULT } from '../core'

export interface SleepContext {
  sleepFor: number
}

export class Sleep extends Action {
  run(context: SleepContext): [ACTIONS_RESULT, ...string[]] {
    if (!context.sleepFor) {
      delete context.sleepFor
      return [ACTIONS_RESULT.SHIFT_AND_CONTINUE]
    }

    context.sleepFor -= 1

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}
