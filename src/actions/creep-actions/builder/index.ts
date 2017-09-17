import { Agent } from '../../../agent'
import { IAction } from '../../../interfaces'
import { GetEnergy } from '../commons'
import { TravelTo } from '../commons'
import { Hauler } from '../hauler'

export const Builder: IAction = {
    name: 'builder',
    run(creep: Creep) {
        if (creep.carry.energy === 0) {
            return [Agent.UNSHIFT_AND_CONTINUE, GetEnergy.name]
        }

        const construction = creep.getTarget(FIND_CONSTRUCTION_SITES, { prop: 'construction' }) as ConstructionSite

        if (construction == null) {
            return [Agent.UNSHIFT_AND_CONTINUE, Hauler.name]
        }

        const result = creep.build(construction)

        if (result === ERR_NOT_IN_RANGE) {
            creep.memory.travelTo = creep.memory.construction
            return [Agent.UNSHIFT_AND_CONTINUE, TravelTo.name]
        }

        if (result === ERR_INVALID_TARGET) {
            delete creep.memory.construction
        }

        return Agent.SHIFT_AND_CONTINUE
    }
}
