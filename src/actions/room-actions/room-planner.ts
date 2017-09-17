import { Agent } from '../../agent'
import { IAction } from '../../interfaces'

export const RoomPlanner: IAction = {
    name: 'room-planner',
    run(room: Room) {
        return Agent.WAIT_NEXT_TICK
    }
}
