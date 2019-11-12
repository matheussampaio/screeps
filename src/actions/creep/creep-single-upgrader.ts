import * as _ from 'lodash'

import { ActionsRegistry, Action } from '../../core'
import { ICreepContext } from './interfaces'

@ActionsRegistry.register
export class CreepSingleUpgrader extends Action {
  run(context: ICreepContext) {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return this.halt()
    }

    const controller: StructureController | undefined = creep.room.controller

    // we should always find the controler...
    if (controller == null) {
      return this.waitNextTick()
    }

    if (controller.level === 8 && CONTROLLER_DOWNGRADE[8] - controller.ticksToDowngrade <= 200) {
      return this.waitNextTick()
    }

    if (!creep.pos.inRangeTo(controller, 3)) {
      creep.travelTo(controller, { range: 3, ignoreCreeps: true })
      return this.waitNextTick()
    }

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      return this.unshiftAndContinue(CreepSingleUpgraderGetEnergy.name)
    }

    creep.upgradeController(controller)

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) as number < creep.getActiveBodyparts(WORK)) {
      return this.unshiftAndContinue(CreepSingleUpgraderGetEnergy.name)
    }

    return this.waitNextTick()
  }
}

@ActionsRegistry.register
export class CreepSingleUpgraderGetEnergy extends Action {
  run(context: ICreepContext) {
    const creep: Creep = Game.creeps[context.creepName]

    if (creep == null) {
      return this.shiftAndStop()
    }

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      return this.shiftAndContinue()
    }

    if (creep.room.controller == null) {
      return this.waitNextTick()
    }

    const storage = creep.room.storage
    const controller = creep.room.controller
    const lowEnergyLimit = (controller && controller.level === 8) ? 100 : 1000

    if (storage && storage.isActive() && storage.store.getUsedCapacity(RESOURCE_ENERGY) as number > lowEnergyLimit) {
      if (creep.pos.isNearTo(storage)) {
        creep.withdraw(storage, RESOURCE_ENERGY)

        return this.shiftAndStop()
      }

      creep.travelTo(storage, { range: 1, ignoreCreeps: true })

      return this.waitNextTick()
    }

    const resource = creep.room.controller.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: r => r.resourceType === RESOURCE_ENERGY,
      ignoreCreeps: true
    })

    if (resource == null || creep.room.controller.pos.getRangeTo(resource) > 3) {
      return this.shiftAndStop()
    }

    if (creep.pos.isNearTo(resource)) {
      creep.pickup(resource)

      return this.shiftAndStop()
    }

    creep.travelTo(resource, { range: 1, ignoreCreeps: true})

    return this.waitNextTick()
  }
}
