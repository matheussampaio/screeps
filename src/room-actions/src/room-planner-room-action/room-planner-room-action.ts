import { Action, ActionRegistry, CreepRoleRegistry } from "../../../engine"
import { FindBasePositionRoomAction } from "./find-base-position-room-action"
import { RoomConstructorRoomAction } from "./room-constructor-room-action"

@ActionRegistry.register
export class RoomPlannerRoomAction extends Action {
    run(room: Room) {
        if (room.memory.center == null) {
            return this.unshiftAndContinue(FindBasePositionRoomAction.name)
        }

        if (Game.time % 10 === 0) {
            return this.unshiftAndContinue(RoomConstructorRoomAction.name)
        }

        // TODO: idle for some ticks
        return this.waitNextTick()
    }
}
