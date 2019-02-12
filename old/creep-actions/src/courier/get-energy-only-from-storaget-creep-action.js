import { Action, ActionRegistry } from '@sae/core'

@ActionRegistry.register
export class GetEnergyOnlyFromStoragetCreepAction extends Action {
  run(creep) {
    // if storage doesn't exists, wait
    if (creep.room.storage == null) {
      return this.waitNextTick()
    }

    // if the creep is far from the storage, travel to storage
    if (!creep.pos.isNearTo(creep.room.storage)) {
      creep.travelTo(creep.room.storage)
      return this.waitNextTick()
    }

    // if storage doesn't have enough energy, wait
    if (creep.room.storage.store.energy < creep.carryCapacity - _.sum(creep.carry)) {
      return this.waitNextTick()
    }

    creep.withdraw(creep.room.storage, RESOURCE_ENERGY)

    return this.shiftAndStop()
  }
}
