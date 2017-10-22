import { Agent } from '../../../agent'
import { IAction } from '../../../interfaces'
import { GetEnergy } from '../commons'
import { TravelTo } from '../commons'
import { Upgrader } from '../upgrader'

export const Builder: IAction = {
    name: 'builder',
    run(creep: Creep) {
        if (creep.carry.energy === 0) {
            return [Agent.UNSHIFT_AND_CONTINUE, GetEnergy.name]
        }

        // search for construction site
        let construction: ConstructionSite = creep.getTarget(FIND_CONSTRUCTION_SITES, { prop: 'construction' }) as ConstructionSite

        // if can't find anything, upgrade the controller
        if (construction == null) {
            return [Agent.SHIFT_UNSHIFT_AND_CONTINUE, Upgrader.name]
        }

        let result = creep.build(construction)

        // move to the target or invalidate the target
        if (result === ERR_NOT_IN_RANGE) {
            creep.memory.travelTo = creep.memory.construction
            return [Agent.UNSHIFT_AND_CONTINUE, TravelTo.name]

        } else if (result === ERR_INVALID_TARGET) {
            delete creep.memory.construction
        }

        return Agent.SHIFT_AND_STOP
    }
}
