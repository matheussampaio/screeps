import * as _ from 'lodash'

import { ActionsRegistry, Action } from '../../core'
import { CreepRecycle } from './creep-recycle'
import { CreepAction } from './creep-action'

@ActionsRegistry.register
export class CreepSingleBuilder extends CreepAction {
  run(context: any) {
    this.context = context

    if (this.creep == null) {
      return this.halt()
    }

    if (this.creep.store.getUsedCapacity() === 0) {
      return this.unshiftAndContinue(CreepSingleBuilderGetEnergy.name)
    }

    const target: any = this.getConstructionTarget()

    if (target == null) {
      return this.unshiftAndContinue(CreepRecycle.name)
    }

    if (this.creep.pos.inRangeTo(target, 3)) {
      this.creep.build(target)
    } else {
      this.creep.travelTo(target, { range: 3 })
    }

    return this.waitNextTick()
  }

  getConstructionTarget(): any {
    if (this.context.buildTarget) {
      const target: any = Game.getObjectById(this.context.buildTarget)

      if (target) {
        return target
      }

      delete this.context.buildTarget
    }

    const targets = this.room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: s => s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
    }).sort((c1, c2) => {
      // build smaller contructions first
      if (c1.progressTotal !== c2.progressTotal) {
        return c1.progressTotal - c2.progressTotal
      }

      // build constructions closer to finish
      if (c1.progress !== c2.progress) {
        return c2.progress - c1.progress
      }

      return c1.pos.getRangeTo(this.creep) - c2.pos.getRangeTo(this.creep)
    })

    if (targets.length === 0) {
      return null
    }

    this.context.buildTarget = targets[0].id

    return targets[0]
  }
}

@ActionsRegistry.register
export class CreepMiniBuilder extends CreepSingleBuilder {
  getConstructionTarget(): any {
    if (this.context.buildTarget) {
      const target: any = Game.getObjectById(this.context.buildTarget)

      if (target) {
        return target
      }

      delete this.context.buildTarget
    }

    const targets = this.room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: s => s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART
    }).sort((c1, c2) => c1.pos.getRangeTo(this.creep) - c2.pos.getRangeTo(this.creep))

    if (targets.length === 0) {
      return null
    }

    this.context.buildTarget = targets[0].id

    return targets[0]
  }
}

@ActionsRegistry.register
export class CreepSingleBuilderGetEnergy extends Action {
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


