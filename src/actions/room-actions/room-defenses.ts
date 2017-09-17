import { Agent } from '../../agent'
import { IAction } from '../../interfaces'

export const RoomDefenses: IAction = {
    name: 'room-defenses',
    run(room: Room) {
        return Agent.WAIT_NEXT_TICK
    }
}
