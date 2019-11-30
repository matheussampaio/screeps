import * as _ from 'lodash'

import { ActionsRegistry  } from '../../core'
import { CreepAction } from './creep-action'
import { CreepRecycle } from './creep-recycle'

@ActionsRegistry.register
export class CreepRepair extends CreepAction {
  run(context: any) {
    this.context = context

    if (this.creep == null) {
      return this.halt()
    }

    const towers = this.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER
    })

    if (towers.length) {
      return this.unshiftAndContinue(CreepRecycle.name)
    }

    if (this.creep.store.getUsedCapacity() === 0) {
      return this.unshiftAndContinue(CreepRepairGetEnergy.name)
    }

    const target: any = this.getRepairTarget()

    if (target == null) {
      return this.unshiftAndContinue(CreepRecycle.name)
    }

    if (this.creep.pos.inRangeTo(target, 3)) {
      this.creep.repair(target)
    } else {
      this.creep.travelTo(target, { range: 3 })
    }

    return this.waitNextTick()
  }

  getRepairTarget(): any {
    if (this.context.repairTarget) {
      const target: any = Game.getObjectById(this.context.repairTarget)

      if (target && target.hits < target.hitsMax) {
        return target
      }

      delete this.context.repairTarget
    }

    const targets = this.room.find(FIND_STRUCTURES, {
      filter: s => s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART && s.hits < s.hitsMax
    })

    if (targets.length === 0) {
      return null
    }

    this.context.repairTarget = targets[0].id

    return targets[0]
  }
}

@ActionsRegistry.register
export class CreepRepairGetEnergy extends CreepRepair {
  run(context: any) {
    const creep: Creep = Game.creeps[context.creepName]

    if (creep == null) {
      return this.shiftAndStop()
    }

    if (creep.store.getFreeCapacity() === 0) {
      return this.shiftAndContinue()
    }

    const target = this.findTarget(context)

    if (target == null) {
       delete context.energyTarget

      return this.retry()
    }

    if (!creep.pos.isNearTo(target)) {
      creep.travelTo(target, { range: 1, ignoreCreeps: true })

      return this.waitNextTick()
    }

    if (target instanceof Resource) {
      creep.pickup(target)
    } else {
      creep.withdraw(target, RESOURCE_ENERGY)
    }

    delete context.energyTarget

    return this.waitNextTick()
  }

  findTarget(context: any): Resource | StructureContainer | StructureStorage | null {
    if (context.energyTarget) {
      const target: any = Game.getObjectById(context.energyTarget)

      if (target) {
        return target
      }
    }

    const creep: Creep = Game.creeps[context.creepName]
    const storage = creep.room.storage

    if (storage && storage.isActive() && storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
      context.energyTarget = storage.id

      return storage
    }

    const resource: Resource | null = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: r => r.resourceType === RESOURCE_ENERGY && r.amount >= 50
    })

    if (resource) {
      context.energyTarget = resource.id

      return resource
    }

    const container: StructureContainer = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity(RESOURCE_ENERGY)
    }) as StructureContainer

    if (container) {
      context.energyTarget = container.id

      return container
    }

    return null
  }
}


