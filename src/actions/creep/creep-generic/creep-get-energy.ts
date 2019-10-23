import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../../core'
import { ICreepGenericContext } from './interfaces'

@ActionsRegistry.register
export class CreepGetEnergy extends Action {
  run(context: ICreepGenericContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return [ACTIONS_RESULT.SHIFT_AND_STOP]
    }

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      delete context.source

      return this.shiftAndContinue()
    }

    let result = this.pickUpEnergy(context)

    if (result) {
      return result
    }

    result = this.withdrawEnergy(context)

    if (result) {
      return result
    }

    result = this.harvest(context)

    if (result) {
      return result
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  pickUpEnergy(context: ICreepGenericContext): [ACTIONS_RESULT, ...string[]] | null {
    const creep: Creep = Game.creeps[context.creepName]

    const resource = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
      filter: r => r.resourceType === RESOURCE_ENERGY
    })

    if (resource == null) {
      return null
    }

    if (creep.pos.isNearTo(resource)) {
      creep.pickup(resource)
    } else {
      creep.moveTo(resource)
    }

    return this.waitNextTick()
  }

  withdrawEnergy(context: ICreepGenericContext): [ACTIONS_RESULT, ...string[]] | null {
    const creep: Creep = Game.creeps[context.creepName]

    const storage = creep.room.storage

    if (storage && storage.isActive && storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
      if (creep.pos.isNearTo(storage)) {
        creep.withdraw(storage, RESOURCE_ENERGY)
      } else {
        creep.moveTo(storage)
      }

      return this.waitNextTick()
    }

    return null
  }

  harvest(context: ICreepGenericContext): [ACTIONS_RESULT, ...string[]] | null {
    const creep: Creep = Game.creeps[context.creepName]

    if (context.source == null) {
      const source: Source | null = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {
        filter: s => s.energy
      })

      if (source == null) {
        this.logger.debug('No source available. waiting...', context.creepName)
        return this.waitNextTick()
      }

      context.source = source.id
    }

    const source: Source | null = Game.getObjectById(context.source)

    // source is gone, try again next tick
    if (source == null || source.energy === 0) {
      delete context.source

      return this.waitNextTick()
    }

    if (creep.pos.isNearTo(source)) {
      creep.harvest(source)
    } else {
      creep.moveTo(source)
    }

    return this.waitNextTick()
  }
}
