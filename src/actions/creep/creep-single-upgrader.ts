import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { ICreepContext } from './interfaces'

export class CreepSingleUpgrader extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return this.halt()
    }

    if (creep.store.getUsedCapacity() === 0) {
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

export class CreepSingleUpgraderGetEnergy extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep = Game.creeps[context.creepName]

    if (creep == null) {
      return this.shiftAndStop()
    }

    if (creep.store.getFreeCapacity() === 0) {
      return this.shiftAndContinue()
    }

    const resources = creep.room.controller.pos.findInRange(FIND_DROPPED_RESOURCES, 4, {
      filter: r => r.resourceType === RESOURCE_ENERGY
    })

    if (resources) {
      const resource = resources[0]

      if (creep.pos.isNearTo(resource)) {
        creep.pickup(resource)
      } else {
        creep.moveTo(resource)
      }

      return this.waitNextTick()
    }

    if (creep.room.storage && creep.room.storage.isActive && creep.room.storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
      if (creep.pos.isNearTo(creep.room.storage)) {
        creep.withdraw(creep.room.storage, RESOURCE_ENERGY)
      } else {
        creep.moveTo(creep.room.storage)
      }

      return this.waitNextTick()
    }

    const resource: Resource | null = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: r => r.resourceType === RESOURCE_ENERGY
    })

    if (resource == null) {
      return this.waitNextTick()
    }

    if (creep.pos.isNearTo(resource)) {
      creep.pickup(resource)
    } else {
      creep.moveTo(resource)
    }

    return this.waitNextTick()
  }
}



