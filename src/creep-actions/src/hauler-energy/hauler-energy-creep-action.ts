import { GetEnergyCreepAction } from '../get-energy'
import { Action, ActionRegistry } from '../../../engine'
import { FindTransferTargetCreepAction } from './find-transfer-target-creep-action'

@ActionRegistry.register
export class HaulerEnergyCreepAction extends Action {
    run(creep: Creep) {
        if (creep.carry.energy === 0) {
            return this.unshiftAndContinue(GetEnergyCreepAction.name)
        }

        const target: StructureSpawn | StructureExtension | StructureStorage = Game.getObjectById(creep.memory.target)

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
