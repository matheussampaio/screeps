import { ACTIONS_RESULT, PRIORITY } from './constants'
import { ActionTreeRunner, ForkOptions } from './action-runner'

export interface IActionConstructor {
  new(): Action
}

export class Action {
  static priority: number = PRIORITY.NORMAL

  run(context: object): [ACTIONS_RESULT, ...string[]] {
    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  public fork(options: ForkOptions): number {
    return ActionTreeRunner.fork(options)
  }
}

