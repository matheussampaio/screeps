import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../core'

interface CityContext {
  roomName: string
}

export class City extends Action {
  run(context: CityContext): [ACTIONS_RESULT, ...string[]] {
    console.log(`Running City Action for: ${context.roomName}`)

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}

