import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { ICreepContext } from './interfaces'
import { CreepBuilder } from './creep-builder'

export class CreepHauler extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return [ACTIONS_RESULT.SHIFT_AND_STOP]
    }

    const isEmpty = _.sum(_.values(creep.carry)) === 0

    if (isEmpty) {
      return [ACTIONS_RESULT.SHIFT_AND_CONTINUE]
    }

    const target: StructureSpawn | StructureExtension | StructureStorage | null = this.getHaulerTarget(creep, context)

    if (target == null) {
      this.logger.debug(`Can't find a target, trying to build sites`, context.creepName)
      return [ACTIONS_RESULT.SHIFT_UNSHIFT_AND_CONTINUE, CreepBuilder.name]
    }

    if (!creep.pos.isNearTo(target)) {
      creep.moveTo(target)
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    creep.transfer(target, RESOURCE_ENERGY)

    delete context.target

    return [ACTIONS_RESULT.SHIFT_AND_STOP]
  }

  getHaulerTarget(creep: Creep, context: ICreepContext): StructureExtension | StructureSpawn | StructureStorage | null {
    if (context.target) {
      const target: StructureSpawn | StructureExtension | StructureStorage | null = Game.getObjectById(context.target)

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
      context.target = extension.id
      return extension
    }

    const spawn: StructureSpawn | null = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
      filter: (s: StructureSpawn) => s.energy < s.energyCapacity
    })

    if (spawn) {
      context.target = spawn.id
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

