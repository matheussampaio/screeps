import { Action, ActionRegistry } from '@sae/core'

@ActionRegistry.register
export class IdleCreepAction extends Action {
    run(creep) {
        if (_.isNumber(creep.memory.idle) && creep.memory.idle) {
            creep.memory.idle -= 1

            return this.waitNextTick()
        }

        delete creep.memory.idle

        return this.shiftAndStop()
    }
}
