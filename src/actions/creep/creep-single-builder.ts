import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'
import { ICreepContext } from './interfaces'

@ActionsRegistry.register
export class CreepSingleBuilder extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return this.halt()
    }

    if (creep.store.getUsedCapacity() === 0) {
      return this.unshiftAndContinue(CreepSingleBuilderGetEnergy.name)
    }

    const target: any = this.getConstructionTarget(creep, context)

    if (target == null) {
      this.logger.debug(`Can't find a construction target.`, context.creepName)
      return this.waitNextTick()
    }

    if (creep.pos.inRangeTo(target, 3)) {
      creep.build(target)
    } else {
      creep.moveTo(target)
    }

    return this.waitNextTick()
  }

  getConstructionTarget(creep: Creep, context: ICreepContext): any {
    if (context.target) {
      const target: any = Game.getObjectById(context.target)

      if (target) {
        return target
      }

      delete context.target
    }

    const targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES).sort((c1, c2) => c2.progress - c1.progress);

    if (targets.length === 0) {
      return null
    }

    context.target = targets[0].id

    return targets[0]
  }
}

@ActionsRegistry.register
export class CreepSingleBuilderGetEnergy extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep = Game.creeps[context.creepName]

    if (creep == null) {
      return this.shiftAndStop()
    }

    if (creep.store.getFreeCapacity() === 0) {
      return this.shiftAndContinue()
    }

    const target = this.findTarget(context)

    if (target == null) {
       delete context.target

      return this.waitNextTick()
    }

    if (!creep.pos.isNearTo(target)) {
      creep.moveTo(target)

      return this.waitNextTick()
    }

    if (target instanceof Resource) {
      creep.pickup(target)
    } else {
      creep.withdraw(target, RESOURCE_ENERGY)
    }

    delete context.target

    return this.waitNextTick()
  }

  findTarget(context: any): Resource | StructureContainer | StructureStorage | null {
    if (context.target) {
      const target: any = Game.getObjectById(context.target)

      if (target) {
        return target
      }
    }

    const creep: Creep = Game.creeps[context.creepName]
    const storage = creep.room.storage

    if (storage && storage.isActive() && storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
      context.target = storage.id

      return storage
    }

    const resource: Resource | null = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: r => r.resourceType === RESOURCE_ENERGY
    })

    if (resource) {
      context.target = resource.id

      return resource
    }

    const container: StructureContainer = creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getUsedCapacity(RESOURCE_ENERGY)
    }) as StructureContainer

    if (container) {
      context.target = container.id

      return container
    }

    return null
  }
}


