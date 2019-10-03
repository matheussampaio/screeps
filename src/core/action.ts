import { ACTIONS_RESULT, PRIORITY } from './constants'

export interface IActionConstructor {
  new(): Action
}

export class Action {
  static priority: number = PRIORITY.NORMAL

  run(context: object): [ACTIONS_RESULT, ...string[]] {
    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}

