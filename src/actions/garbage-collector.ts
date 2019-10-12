import { Action, ACTIONS_RESULT } from '../core'
import { Sleep, SleepContext } from './sleep'

export class GarbageCollector extends Action {
  run(context: SleepContext): [ACTIONS_RESULT, ...string[]] {
    for (const creepName in Memory.creeps) {
      if (Game.creeps[creepName] == null) {
        delete Memory.creeps[creepName]
      }
    }

    for (const roomName in Memory.rooms) {
      if (Game.rooms[roomName] == null) {
        delete Memory.rooms[roomName]
      }
    }

    context.sleepFor = 50

    return [ACTIONS_RESULT.UNSHIFT_AND_CONTINUE, Sleep.name]
  }
}
