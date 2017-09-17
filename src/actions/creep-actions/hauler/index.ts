import { Agent } from '../../../agent'
import { IAction } from '../../../interfaces'
import { GetEnergy } from '../commons'
import { Upgrader } from '../upgrader'

export const Hauler: IAction = {
    name: 'hauler',
    run(creep: Creep) {
        if (creep.carry.energy === 0) {
            return [Agent.UNSHIFT_AND_CONTINUE, GetEnergy.name]
        }

        const target: StructureSpawn | StructureExtension = Game.getObjectById(creep.memory.target)

        if (target == null || target.energy === target.energyCapacity) {
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

        return Agent.SHIFT_AND_STOP
    }
}

export const FindTransferTarget: IAction = {
    name: 'find_transfer_target',
    run(creep: Creep) {
        let target = creep.getTarget(FIND_MY_STRUCTURES, {
            filter: (s: StructureExtension) => {
                return s.structureType === STRUCTURE_EXTENSION && s.energy < s.energyCapacity
            }
        })

        if (target == null) {
            target = creep.getTarget(FIND_MY_SPAWNS, { filter: (s: StructureSpawn) => s.energy < s.energyCapacity })
        }

        if (target == null) {
            return [Agent.UNSHIFT_AND_CONTINUE, Upgrader.name]
        }

        return Agent.SHIFT_AND_CONTINUE
    }
}
