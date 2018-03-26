import { Action, ActionRegistry } from '@sae/core'
// import { CourierCreepRole } from '@sae/creep-roles'

import { GetEnergyCreepAction } from '../get-energy'
import { FindTransferTargetCreepAction } from './find-transfer-target-creep-action'

@ActionRegistry.register
export class HaulerEnergyCreepAction extends Action {
    run(creep) {
        if (creep.carry.energy === 0) {
            return this.unshiftAndContinue(GetEnergyCreepAction.name)
        }

        let target = Game.getObjectById(creep.memory.target)

        // Fix, this shouldnt use strings
        if (target == null && creep.room.storage && creep.room.creeps.CourierCreepRole) {
            creep.memory.target = creep.room.storage.id

            target = creep.room.storage
        }

        if (target == null || target.isFull()) {
            delete creep.memory.target

            return this.unshiftAndContinue(FindTransferTargetCreepAction.name)
        }

        const result = creep.transfer(target, RESOURCE_ENERGY)

        if (result === OK) {
            delete creep.memory.target

            return this.shiftAndStop()
        }

        if (result === ERR_NOT_IN_RANGE) {
            creep.travelTo(target)
        }

        if (result === ERR_INVALID_TARGET) {
            delete creep.memory.target
        }

        if (result === ERR_FULL) {
            delete creep.memory.target
        }

        return this.shiftAndStop()
    }
}
