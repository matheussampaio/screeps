import { Agent } from '../../../agent'
import { IAction } from '../../../interfaces'
import { GetEnergyFromStorage } from '../commons'

export const Upgrader: IAction = {
    name: 'upgrader',
    run(creep: Creep) {
        if (creep.carry.energy === 0) {
            return [Agent.UNSHIFT_AND_CONTINUE, GetEnergyFromStorage.name]
        }

        const result = creep.upgradeController(creep.room.controller)

        if (result === ERR_NOT_IN_RANGE) {
            creep.travelTo(creep.room.controller, { range: 3 })
        }

        return Agent.SHIFT_AND_STOP
    }
}
