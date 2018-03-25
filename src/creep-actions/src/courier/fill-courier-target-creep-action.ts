import { Action, ActionRegistry } from '../../../engine'
import { GetEnergyFromStorageCreepAction } from '../get-energy'
import { FindCourierTargetCreepAction } from './find-courier-target-creep-action'

@ActionRegistry.register
export class FillCourierTargetCreepAction extends Action {
    run(creep: Creep) {
        if (creep.carry.energy === 0) {
            return this.unshiftAndContinue(GetEnergyOnlyFromStoragetCreepAction.name)
        }

        const target: StructureSpawn | StructureExtension | StructureTower | StructureTerminal = Game.getObjectById(
            creep.memory.target
        )

        // TODO: Find transfer target should be an action
        if (target == null || target.isFull()) {
            return this.unshiftAndContinue(FindCourierTargetCreepAction.name)
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

@ActionRegistry.register
export class GetEnergyOnlyFromStoragetCreepAction extends Action {
    run(creep: Creep) {
        // if storage doesn't exists, wait
        if (creep.room.storage == null) {
            return this.waitNextTick()
        }

        // if the creep is far from the storage, travel to storage
        if (!creep.pos.isNearTo(creep.room.storage)) {
            creep.travelTo(creep.room.storage)
            return this.waitNextTick()
        }

        // if storage doesn't have enough energy, wait
        if (creep.room.storage.store.energy < creep.carryCapacity - _.sum(creep.carry)) {
            return this.waitNextTick()
        }

        const result = creep.withdraw(creep.room.storage, RESOURCE_ENERGY)

        return this.shiftAndStop()
    }
}
