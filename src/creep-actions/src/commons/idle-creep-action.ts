import { Action, ActionRegistry } from "../../../engine"

@ActionRegistry.register
export class IdleCreepAction extends Action {
    run(creep: Creep) {
        if (_.isNumber(creep.memory.idle) && creep.memory.idle) {
            creep.memory.idle -= 1

            return this.waitNextTick()
        }

        delete creep.memory.idle

        return this.shiftAndStop()
    }
}
