import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'
import { City, RoomStopIfConflict, Spawner, ICityContext, CityDefense, CityEmergency, CityPlanner } from '../city'
import { ICountryContext } from './interfaces'

@ActionsRegistry.register
export class Country extends Action {
  run(context: ICountryContext): [ACTIONS_RESULT, ...string[]] {
    _.defaults(context, {
      rooms: {}
    })

    for (const roomName in Game.rooms) {
      const process = this.getProcessByPID(context.rooms[roomName])

      if (process == null) {
        const memory: Partial<ICityContext> = {
          roomName
        }

        const PID: number = this.fork({
          memory,
          actions: [[RoomStopIfConflict.name], [CityEmergency.name], [City.name], [CityDefense.name], [Spawner.name], [CityPlanner.name]],
          name: `City-${roomName}`
        })

        const room: Room = Game.rooms[roomName]

        room.memory.PID = PID
        context.rooms[roomName] = PID
      }
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}
