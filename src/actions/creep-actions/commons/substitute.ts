import { Agent } from '../../../agent'
import { IAction } from '../../../interfaces'

export const Substitute: IAction = {
    name: 'substitute',
    run(creep: Creep) {
        if (creep.memory.subTarget == null) {
            return Agent.UNSHIFT_AND_CONTINUE
        }

        const target: Creep = Game.getObjectById(creep.memory.subTarget)

        if (target == null) {
            return Agent.SHIFT_AND_CONTINUE
        }

        creep.travelTo(target)

        if (creep.pos.inRangeTo(target.pos, 1) || target.ticksToLive <= 2) {
            target.dieInPeace(creep)

            creep.memory.substitute = undefined

            return Agent.SHIFT_AND_STOP
        }

        return Agent.WAIT_NEXT_TICK
    }
}
