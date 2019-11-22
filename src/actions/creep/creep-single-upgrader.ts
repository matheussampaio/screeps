import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { ICreepContext } from './interfaces'
import { CreepAction } from './creep-action'

@ActionsRegistry.register
export class CreepSingleUpgrader extends CreepAction {
  run(context: ICreepContext) {
    this.context = context

    if (this.controller == null) {
      return this.waitNextTick()
    }

    if (this.controller.level === 8 && CONTROLLER_DOWNGRADE[8] - this.controller.ticksToDowngrade <= 200) {
      return this.waitNextTick()
    }

    if (!this.creep.pos.inRangeTo(this.controller, 3)) {
      this.creep.travelTo(this.controller, { range: 3, ignoreCreeps: true })
      return this.waitNextTick()
    }

    if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      return this.unshiftAndContinue(CreepSingleUpgraderGetEnergy.name)
    }

    this.creep.memory.avoidMoving = true

    if (this.controller.upgradeBlocked) {
      return this.waitNextTick()
    }

    this.creep.upgradeController(this.controller)

    if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) as number < this.creep.getActiveBodyparts(WORK)) {
      return this.unshiftAndContinue(CreepSingleUpgraderGetEnergy.name)
    }

    return this.waitNextTick()
  }
}

@ActionsRegistry.register
export class CreepSingleUpgraderGetEnergy extends CreepSingleUpgrader {
  run(context: ICreepContext) {
    this.context = context

    if (this.creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      return this.shiftAndContinue()
    }

    if (this.controller == null) {
      return this.waitNextTick()
    }

    const lowEnergyLimit = (this.controller && this.controller.level === 8) ? 100 : 15000

    if (this.storage && this.storage.isActive()) {
      if (!this.creep.pos.isNearTo(this.storage)) {
        this.creep.travelTo(this.storage, { range: 1, ignoreCreeps: true })

        return this.waitNextTick()
      }

      if (this.storage.store.getUsedCapacity(RESOURCE_ENERGY) as number < lowEnergyLimit) {
        return this.waitNextTick()
      }

      this.creep.withdraw(this.storage, RESOURCE_ENERGY)

      return this.shiftAndStop()
    }

    const resource = this.controller.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: r => r.resourceType === RESOURCE_ENERGY,
      ignoreCreeps: true
    })

    if (resource == null || this.controller.pos.getRangeTo(resource) > 3) {
      return this.shiftAndStop()
    }

    if (this.creep.pos.isNearTo(resource)) {
      this.creep.pickup(resource)

      return this.shiftAndStop()
    }

    this.creep.travelTo(resource, { range: 1, ignoreCreeps: true})

    return this.waitNextTick()
  }
}
