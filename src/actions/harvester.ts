import { Action, ACTIONS_RESULT } from '../core'

export class Harvester extends Action {
  run(context: object): [ACTIONS_RESULT, ...string[]] {
    console.log(context)

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}
