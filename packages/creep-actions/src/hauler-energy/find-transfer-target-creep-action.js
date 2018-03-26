import { Action, ActionRegistry } from '@sae/core'

import { BuilderCreepAction } from '../builder'

@ActionRegistry.register
export class FindTransferTargetCreepAction extends Action {
    run(creep) {
        let target = creep.getTarget(FIND_MY_STRUCTURES, {
            filter: (s) => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity - 250
        })

        if (target == null) {
            target = creep.getTarget(FIND_MY_STRUCTURES, {
                filter: (s) =>
                    (s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN) && !s.isFull()
            })
        }

        if (target == null && creep.room.storage && !creep.room.storage.isFull()) {
            creep.memory.target = creep.room.storage.id

            return this.shiftAndContinue()
        }

        if (target == null) {
            if (creep.getActiveBodyparts(WORK)) {
                return this.shiftUnshitAndContinue(BuilderCreepAction.name)
            }

            return this.waitNextTick()
        }

        return this.shiftAndContinue()
    }
}
