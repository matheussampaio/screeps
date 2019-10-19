import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { ICreepContext } from './interfaces'

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

export class CreepSingleBuilderGetEnergy extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep = Game.creeps[context.creepName]

    if (creep == null) {
      return this.shiftAndStop()
    }

    if (creep.store.getFreeCapacity() === 0) {
      return this.shiftAndContinue()
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


