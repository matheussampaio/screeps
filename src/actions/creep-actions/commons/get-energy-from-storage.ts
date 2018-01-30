import { Agent } from '../../../agent'
import { IAction } from '../../../interfaces'

export const GetEnergyFromStorage: IAction = {
    name: 'get-energy-from-storage',
    run(creep: Creep) {
        if (creep.carry.energy === creep.carryCapacity) {
            delete creep.memory.energy
            return Agent.SHIFT_AND_CONTINUE
        }

        if (creep.room.storage == null) {
            return [Agent.SHIFT_AND_CONTINUE, GetEnergy.name]
        }

        if (creep.room.storage.energyAvailable <= 5000) {
            return [Agent.SHIFT_AND_CONTINUE, GetEnergy.name]
        }

        const result = creep.withdraw(creep.room.storage, RESOURCE_ENERGY)

        if (result === ERR_NOT_IN_RANGE) {
            creep.travelTo(creep.room.storage)
        }

        return Agent.WAIT_NEXT_TICK
    }
}
