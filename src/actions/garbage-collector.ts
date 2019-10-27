import { ActionsRegistry, Action, ACTIONS_RESULT } from '../core'

@ActionsRegistry.register
export class GarbageCollector extends Action {
  run() {
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

    return this.sleep(50)
  }
}
