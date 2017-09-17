import { Agent } from '../../../agent'
import { IAction } from '../../../interfaces'

export const TravelTo: IAction = {
    name: 'travel-to',
    run(creep: Creep) {
        if (creep.memory.travelTo == null) {
            return Agent.SHIFT_AND_STOP
        }

        const target: RoomObject = Game.getObjectById(creep.memory.travelTo)

        if (target == null) {
            return Agent.SHIFT_AND_CONTINUE
        }

        if (creep.pos.getRangeTo(target.pos) > 1) {
            creep.travelTo(target)
            return Agent.WAIT_NEXT_TICK
        }

        creep.memory.travelTo = undefined
        creep.memory._trav = undefined

        return Agent.SHIFT_AND_CONTINUE
    }
}
