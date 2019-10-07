import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../core'

interface CreepContext {
  creepName: string
  action?: string
  source?: string
  target?: string
}

export class CreepAction extends Action {
  run(context: CreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return [ACTIONS_RESULT.HALT]
    }

    if (creep.spawning) {
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    const isEmpty = _.sum(_.values(creep.carry)) === 0

    if (isEmpty) {
      return [ACTIONS_RESULT.UNSHIFT_AND_CONTINUE, CreepGetEnergy.name]
    }

    if (_.keys(Game.creeps).length >= 10) {
      return [ACTIONS_RESULT.UNSHIFT_AND_CONTINUE, CreepUpgradeController.name]
    }

    return [ACTIONS_RESULT.UNSHIFT_AND_CONTINUE, CreepHauler.name]
  }
}

export class CreepGetEnergy extends Action {
  run(context: CreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return [ACTIONS_RESULT.SHIFT_AND_STOP]
    }

    const isFull = _.sum(_.values(creep.carry)) === creep.carryCapacity

    if (isFull) {
      return [ACTIONS_RESULT.SHIFT_AND_CONTINUE]
    }

    if (context.source == null) {
      const closestSource: Source | null = creep.pos.findClosestByPath(FIND_SOURCES)

      if (closestSource == null) {
        this.logger.debug(`Can't find a source to get energy from.`, context.creepName)
        return [ACTIONS_RESULT.WAIT_NEXT_TICK]
      }

      context.source = closestSource.id
    }

    const source: Source | null = Game.getObjectById(context.source)

    // source is gone, try again next tick
    if (source == null) {
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

export class CreepUpgradeController extends Action {
  run(context: CreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return [ACTIONS_RESULT.SHIFT_AND_STOP]
    }

    const isEmpty = _.sum(_.values(creep.carry)) === 0

    if (isEmpty) {
      return [ACTIONS_RESULT.SHIFT_AND_CONTINUE]
    }

    const controller: StructureController | undefined = creep.room.controller

    if (controller == null) {
      this.logger.error(`Can't find controller`, context.creepName)
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (creep.pos.inRangeTo(controller, 3)) {
      creep.upgradeController(controller)
    } else {
      creep.moveTo(controller)
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}

export class CreepHauler extends Action {
  run(context: CreepContext): [ACTIONS_RESULT, ...string[]] {
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
      this.logger.debug(`Can't find a target`, context.creepName)
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (!creep.pos.isNearTo(target)) {
      creep.moveTo(target)
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    creep.transfer(target, RESOURCE_ENERGY)

    delete context.target

    return [ACTIONS_RESULT.SHIFT_AND_STOP]
  }

  getHaulerTarget(creep: Creep, context: CreepContext): StructureExtension | StructureSpawn | StructureStorage | null {
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

    if (creep.room.storage) {
      context.target = creep.room.storage.id
      return creep.room.storage
    }

    return null
  }
}
