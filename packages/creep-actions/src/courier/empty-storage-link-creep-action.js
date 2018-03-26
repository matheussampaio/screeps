import { Action, ActionRegistry } from '@sae/core'

import { GetEnergyFromStorageCreepAction } from '../get-energy'

@ActionRegistry.register
export class EmptyStorageLinkCreepAction extends Action {
  run(creep) {
    const linkId = _.get(creep, `room.memory.links.storage`)

    if (linkId == null) {
      return this.shiftAndContinue()
    }

    const link = Game.getObjectById(linkId)

    if (link || link.energy === 0) {
      return this.shiftAndContinue()
    }

    if (_.sum(creep.carry) === creep.carryCapacity) {
      const result = creep.transfer(creep.room.storage, RESOURCE_ENERGY)

      if (result === ERR_NOT_IN_RANGE) {
        creep.travelTo(creep.room.storage)

        return this.waitNextTick()
      }
    }

    const result = creep.withdraw(link, RESOURCE_ENERGY)

    if (result === ERR_NOT_IN_RANGE) {
      creep.travelTo(link)

      return this.waitNextTick()
    }

    return this.waitNextTick()
  }
}
