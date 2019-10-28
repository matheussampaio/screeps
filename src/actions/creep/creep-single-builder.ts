import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'
import { ICreepContext } from './interfaces'

@ActionsRegistry.register
export class CreepSingleBuilder extends Action {
  run(context: any) {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return this.halt()
    }

    if (creep.store.getUsedCapacity() === 0) {
      return this.unshiftAndContinue(CreepSingleBuilderGetEnergy.name)
    }

    const target: any = this.getConstructionTarget(creep, context)

    if (target == null) {
      return this.sleep(10)
    }

    if (creep.pos.inRangeTo(target, 3)) {
      creep.build(target)
    } else {
      creep.travelTo(target, { range: 3 })
    }

    return this.waitNextTick()
  }

  getConstructionTarget(creep: Creep, context: any): any {
    if (context.buildTarget) {
      const target: any = Game.getObjectById(context.buildTarget)

      if (target) {
        return target
      }

      delete context.buildTarget
    }

    const targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES).sort((c1, c2) => {
      // build smaller contructions first
      if (c1.progressTotal !== c2.progressTotal) {
        return c1.progressTotal - c2.progressTotal
      }

      // build constructions closer to finish
      if (c1.progress !== c2.progress) {
        return c2.progress - c1.progress
      }

      const storage = creep.room.storage

      // build constructions close to storage first
      if (storage) {
        return c1.pos.getRangeTo(storage) - c2.pos.getRangeTo(storage)
      }

      const controller = creep.room.controller

      if (controller) {
        return c1.pos.getRangeTo(controller) - c2.pos.getRangeTo(controller)
      }

      return c1.pos.getRangeTo(creep) - c2.pos.getRangeTo(creep)
    })

    if (targets.length === 0) {
      return null
    }

    context.buildTarget = targets[0].id

    return targets[0]
  }
}

@ActionsRegistry.register
export class CreepSingleBuilderGetEnergy extends Action {
  run(context: any): [ACTIONS_RESULT, ...string[]] {
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
      creep.travelTo(target, { range: 1 })

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


