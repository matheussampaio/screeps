import { Action, ActionRegistry } from '@sae/core'

import { GetEnergyCreepAction } from './get-energy-creep-action'

@ActionRegistry.register
export class GetEnergyFromStorageCreepAction extends Action {
  run(creep) {
    if (creep.carry.energy === creep.carryCapacity) {
      delete creep.memory.energy

      return this.shiftAndContinue()
    }

    if (creep.room.storage == null) {
      return this.shiftUnshitAndContinue(GetEnergyCreepAction.name)
    }

    if (creep.room.storage.store.energy <= 5000) {
      return this.shiftUnshitAndContinue(GetEnergyCreepAction.name)
    }

    const result = creep.withdraw(creep.room.storage, RESOURCE_ENERGY)

    if (result === ERR_NOT_IN_RANGE) {
      creep.travelTo(creep.room.storage)
    }

    return this.waitNextTick()
  }
}
