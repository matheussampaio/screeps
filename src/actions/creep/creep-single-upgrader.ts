import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'
import { ICreepContext } from './interfaces'

@ActionsRegistry.register
export class CreepSingleUpgrader extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return this.halt()
    }

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      return this.unshiftAndContinue(CreepSingleUpgraderGetEnergy.name)
    }

    const controller: StructureController | undefined = creep.room.controller

    // we should always find the controler...
    if (controller == null) {
      this.logger.error(`Can't find controller`, context.creepName)
      return this.waitNextTick()
    }

    if (context.rangeToController == null) {
      context.rangeToController = Math.floor(Math.random() * 3) + 1
    }

    if (creep.pos.inRangeTo(controller, context.rangeToController)) {
      creep.upgradeController(controller)
    } else {
      creep.moveTo(controller)
    }

    return this.waitNextTick()
  }
}

@ActionsRegistry.register
export class CreepSingleUpgraderGetEnergy extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep = Game.creeps[context.creepName]

    if (creep == null) {
      return this.shiftAndStop()
    }

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      return this.shiftAndContinue()
    }

    if (creep.room.controller == null) {
      this.logger.info('cant find controller, stopping', context.creepName)
      return this.waitNextTick()
    }

    const resources = creep.room.controller.pos.findInRange(FIND_DROPPED_RESOURCES, 4, {
      filter: r => r.resourceType === RESOURCE_ENERGY
    })

    if (resources.length) {
      const resource = resources[0]

      if (creep.pos.isNearTo(resource)) {
        creep.pickup(resource)
      } else {
        creep.moveTo(resource)
      }

      return this.waitNextTick()
    }

    const storage = creep.room.storage

    if (storage && storage.isActive() && storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
      if (creep.pos.isNearTo(storage)) {
        creep.withdraw(storage, RESOURCE_ENERGY)
      } else {
        creep.moveTo(storage)
      }

      return this.waitNextTick()
    }

    return this.waitNextTick()
  }
}
