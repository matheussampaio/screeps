import * as _ from 'lodash'

import { ActionsRegistry, Action } from '../../../core'
import { ICreepGenericContext } from './interfaces'
// import { CreepBuilder } from './creep-builder'

@ActionsRegistry.register
export class CreepHauler extends Action {
  run(context: ICreepGenericContext) {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return this.shiftAndStop()
    }

    if (!creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
      return this.shiftAndContinue()
    }

    const target: StructureSpawn | StructureExtension | null = this.getHaulerTarget(creep, context)

    if (target == null) {
      // this.logger.debug(`Can't find a target, trying to build sites`, context.creepName)
      return this.shiftAndStop()
    }

    if (!creep.pos.isNearTo(target)) {
      creep.travelTo(target, { range: 1, ignoreCreeps: true })
      return this.waitNextTick()
    }

    creep.transfer(target, RESOURCE_ENERGY)

    delete context.target

    return this.shiftAndStop()
  }

  getHaulerTarget(creep: Creep, context: ICreepGenericContext): StructureExtension | StructureSpawn | null {
    if (context.target) {
      const target: StructureSpawn | StructureExtension | null = Game.getObjectById(context.target)

      if (target) {
        return target
      }
    }

    const extension: StructureExtension | null = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: (s: StructureExtension) => {
        return s.structureType === STRUCTURE_EXTENSION && s.energy < s.energyCapacity
      }
    }) as StructureExtension | null

    if (extension) {
      context.target = extension.id as string
      return extension
    }

    const spawn: StructureSpawn | null = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
      filter: (s: StructureSpawn) => s.energy < s.energyCapacity
    })

    if (spawn) {
      context.target = spawn.id as string
      return spawn
    }

    // @FIXME: since the storage can hold 1M resources,
    // we would get in a dead lock until this get filled.
    // if (creep.room.storage) {
    //   context.target = creep.room.storage.id
    //   return creep.room.storage
    // }

    return null
  }
}

