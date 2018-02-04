import { Action, ActionRegistry } from '../../../engine'


@ActionRegistry.register
export class ReplaceCreepAction extends Action {
    run(creep: Creep) {
        if (creep.memory.subTarget == null) {
            return this.shiftAndContinue()
        }

        const target: Creep = Game.getObjectById(creep.memory.subTarget)

        if (target == null) {
            return this.shiftAndContinue()
        }

        creep.travelTo(target)

        if (creep.pos.isNearTo(target) || target.ticksToLive <= 2) {
            target.dieInPeace(creep)

            creep.memory.substitute = undefined

            return this.shiftAndContinue()
        }

        return this.waitNextTick()
    }
}
