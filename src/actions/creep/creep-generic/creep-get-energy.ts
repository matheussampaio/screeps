import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../../core'
import { ICreepGenericContext } from './interfaces'

export class CreepGetEnergy extends Action {
  run(context: ICreepGenericContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return [ACTIONS_RESULT.SHIFT_AND_STOP]
    }

    const isFull = _.sum(_.values(creep.carry)) === creep.carryCapacity

    if (isFull) {
      delete context.source
      return [ACTIONS_RESULT.SHIFT_AND_CONTINUE]
    }

    // @TODO: Select the closest resource
    // @TODO: Mark the resource so no other creep go for it at the same time
    const resource = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: r => r.resourceType === RESOURCE_ENERGY
    })

    if (resource) {
      if (creep.pos.isNearTo(resource)) {
        creep.pickup(resource)
      } else {
        creep.moveTo(resource)
      }

      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (context.source == null) {
      const source: Source | null = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {
        filter: s => s.energy
      })

      if (source == null) {
        this.logger.debug('No source available. waiting...', context.creepName)
        return [ACTIONS_RESULT.WAIT_NEXT_TICK]
      }

      context.source = source.id
    }

    const source: Source | null = Game.getObjectById(context.source)

    // source is gone, try again next tick
    if (source == null || source.energy === 0) {
      delete context.source
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (creep.pos.isNearTo(source)) {
      creep.harvest(source)
    } else {
      creep.moveTo(source)
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}
