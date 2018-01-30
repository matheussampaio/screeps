import { Agent } from '../../../agent'
import { IAction } from '../../../interfaces'
import { GetEnergy } from '../commons'
import { Builder } from '../builder'

export const Hauler: IAction = {
    name: 'hauler',
    run(creep: Creep) {
        if (creep.carry.energy === 0) {
            return [Agent.UNSHIFT_AND_CONTINUE, GetEnergy.name]
        }

        const target: StructureSpawn | StructureExtension | StructureStorage = Game.getObjectById(creep.memory.target)

        if (target == null || target.isFull()) {
            delete creep.memory.target
            return [Agent.UNSHIFT_AND_CONTINUE, FindTransferTarget.name]
        }

        const result = creep.transfer(target, RESOURCE_ENERGY)

        if (result === OK) {
            delete creep.memory.target
            return Agent.SHIFT_AND_STOP
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

        return Agent.SHIFT_AND_STOP
    }
}

export const FindTransferTarget: IAction = {
    name: 'find_transfer_target',
    run(creep: Creep) {
        let target = creep.getTarget(FIND_MY_STRUCTURES, {
            filter: (s: StructureTower) => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity - 250
        })

        if (target == null) {
            target = creep.getTarget(FIND_MY_STRUCTURES, {
                filter: (s: StructureExtension) => (s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN) && !s.isFull()
            })
        }

        if (target == null && creep.room.storage && !creep.room.storage.isFull()) {
           creep.memory.target = creep.room.storage.id
           return Agent.SHIFT_AND_CONTINUE
        }

        if (target == null) {
            return [Agent.SHIFT_UNSHIFT_AND_CONTINUE, Builder.name]
        }

        if (target == null) {
            return Agent.WAIT_NEXT_TICK
        }

        return Agent.SHIFT_AND_CONTINUE
    }
}
