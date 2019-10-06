import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../core'
import { City } from './city'

interface CountryContext {
  rooms: { [roomName:string]: number }
}

export class Country extends Action {
  run(context: CountryContext): [ACTIONS_RESULT, ...string[]] {
    _.defaults(context, {
      rooms: {}
    })

    for (const roomName in Game.rooms) {
      if (context.rooms[roomName] == null) {
        context.rooms[roomName] = this.fork({
          actions: [[City.name]],
          memory: { roomName }
        })
      }
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}
