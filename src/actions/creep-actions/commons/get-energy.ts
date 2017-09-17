import { Agent } from '../../../agent'
import { IAction } from '../../../interfaces'
import { TravelTo } from './travel-to'

export const GetEnergy: IAction = {
    name: 'get_energy',
    run(creep: Creep) {
        if (creep.carry.energy === creep.carryCapacity) {
            delete creep.memory.energy
            return Agent.SHIFT_AND_CONTINUE
        }

        const energy = Game.getObjectById(creep.memory.energy)

        let result = null

        if (energy == null) {
            return [Agent.UNSHIFT_AND_CONTINUE, FindEnergyToGrab.name]

        } else if (energy instanceof Resource) {
            result = creep.pickup(energy)

        } else if (energy instanceof StructureContainer) {
            result = creep.withdraw(energy, RESOURCE_ENERGY)
        }

        if (result === ERR_NOT_IN_RANGE) {
            creep.memory.travelTo = creep.memory.energy
            return [Agent.UNSHIFT_AND_CONTINUE, TravelTo.name]
        }

        if (result === ERR_INVALID_TARGET) {
            delete creep.memory.energy
        }

        return Agent.WAIT_NEXT_TICK
    }
}

export const FindEnergyToGrab: IAction = {
    name: 'find-energy-to-grab',
    run(creep: Creep) {
        creep.getTarget(FIND_DROPPED_RESOURCES, { algorithm: 'astart', prop: 'energy' })

        if (creep.memory.energy != null) {
            return Agent.SHIFT_AND_CONTINUE
        }

        creep.getTarget(FIND_STRUCTURES, {
            filter: (s: StructureContainer) => s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY],
            prop: 'energy'
        })

        if (creep.memory.energy != null) {
            return Agent.SHIFT_AND_CONTINUE
        }

        return Agent.WAIT_NEXT_TICK
    }
}
