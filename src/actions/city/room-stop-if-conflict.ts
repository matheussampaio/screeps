import { Action, Process, ACTIONS_RESULT } from '../../core'

export class RoomStopIfConflict extends Action {
  run(context: any, process: Process): [ACTIONS_RESULT, ...string[]] {
    const room = Game.rooms[context.roomName]

    // stop if we lose access to this room
    if (room == null) {
      return [ACTIONS_RESULT.HALT]
    }

    // stop if another process owns this room
    if (room.memory.PID !== process.PID) {
      return [ACTIONS_RESULT.HALT]
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}
