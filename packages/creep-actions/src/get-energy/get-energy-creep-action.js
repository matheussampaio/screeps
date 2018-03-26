import { Action, ActionRegistry } from '@sae/core'

import { TravelToCreepAction } from '../travel'
import { FindEnergyToGrabCreepAction } from './find-energy-to-grab-creep-action'

@ActionRegistry.register
export class GetEnergyCreepAction extends Action {
    run(creep) {
        if (creep.carry.energy === creep.carryCapacity) {
            delete creep.memory.energy

            return this.shiftAndContinue()
        }

        const energy = Game.getObjectById(creep.memory.energy)

        let result = null

        if (energy == null) {
            return this.unshiftAndContinue(FindEnergyToGrabCreepAction.name)
        }

        if (energy instanceof Resource) {
            result = creep.pickup(energy)
        } else if (energy instanceof StructureContainer) {
            result = creep.withdraw(energy, RESOURCE_ENERGY)
        }

        if (result === ERR_NOT_IN_RANGE) {
            creep.memory.travelTo = creep.memory.energy

            return this.unshiftAndContinue(TravelToCreepAction.name)
        }

        if (result !== OK) {
            delete creep.memory.energy
        }

        return this.waitNextTick()
    }
}
