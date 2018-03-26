import { Action, ActionRegistry } from '@sae/core'

import { GetEnergyFromStorageCreepAction } from '../get-energy'

@ActionRegistry.register
export class UpgradeControllerCreepAction extends Action {
  run(creep) {
    if (creep.carry.energy === 0) {
      return this.unshiftAndContinue(GetEnergyFromStorageCreepAction.name)
    }

    const result = creep.upgradeController(creep.room.controller)

    if (result === ERR_NOT_IN_RANGE) {
      creep.travelTo(creep.room.controller, { range: 3 })
    }

    return this.shiftAndStop()
  }
}
