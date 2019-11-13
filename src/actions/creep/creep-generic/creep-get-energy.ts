import * as _ from 'lodash'

import { ActionsRegistry, Action } from '../../../core'
import { ICreepGenericContext } from './interfaces'

@ActionsRegistry.register
export class CreepGetEnergy extends Action {
  run(context: ICreepGenericContext) {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return this.shiftAndStop()
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

    return this.waitNextTick()
  }

  pickUpEnergy(context: ICreepGenericContext) {
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
      creep.travelTo(resource)
    }

    return this.waitNextTick()
  }

  withdrawEnergy(context: ICreepGenericContext) {
    const creep: Creep = Game.creeps[context.creepName]

    const room = Game.rooms[creep.memory.roomName]

    if (room == null) {
      return null
    }

    const storage = room.storage

    if (storage && storage.isActive() && storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
      if (creep.pos.isNearTo(storage)) {
        creep.withdraw(storage, RESOURCE_ENERGY)
      } else {
        creep.travelTo(storage)
      }

      return this.waitNextTick()
    }

    return null
  }

  harvest(context: ICreepGenericContext) {
    const creep: Creep = Game.creeps[context.creepName]

    if (context.source == null) {
      const source: Source | null = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE, {
        filter: s => s.energy
      })

      if (source == null) {
        this.logger.debug('No source available. waiting...', context.creepName)
        return this.waitNextTick()
      }

      context.source = source.id as string
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
      creep.travelTo(source)
    }

    return this.waitNextTick()
  }
}
