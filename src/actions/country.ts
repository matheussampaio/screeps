import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../core'
import { City } from './city'
import { GarbageCollector } from './garbage-collector'

export interface CountryContext {
  rooms: { [roomName:string]: number }
}

declare global {
  interface RoomMemory {
    PID: number
  }
}

export class Country extends Action {
  run(context: CountryContext): [ACTIONS_RESULT, ...string[]] {
    _.defaults(context, {
      rooms: {}
    })

    for (const roomName in Game.rooms) {
      const process = this.getProcessByPID(context.rooms[roomName])

      if (process == null) {
        const PID: number = this.fork({
          actions: [[City.name]],
          memory: { roomName }
        })

        const room: Room = Game.rooms[roomName]

        room.memory.PID = PID
        context.rooms[roomName] = PID
      }
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}
