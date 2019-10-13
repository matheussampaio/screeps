import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { ICreepContext } from './interfaces'

export class CreepSingleHauler extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep = Game.creeps[context.creepName]

    const isEmpty = _.sum(_.values(creep.carry)) === 0

    if (isEmpty) {
      return this.getEnergy(context)
    }

    return this.fill(context)

  }

  fill(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    const target: StructureSpawn | StructureExtension | StructureStorage | StructureTower | null = this.getTransferTarget(creep, context)

    if (target == null) {
      if (context.spawn == null) {
        const spawns: StructureSpawn[] = creep.room.find(FIND_MY_STRUCTURES, {
          filter: s => s.structureType === STRUCTURE_SPAWN
        }) as StructureSpawn[]

        if (spawns.length === 0) {
          return [ACTIONS_RESULT.WAIT_NEXT_TICK]
        }

        context.spawn = spawns[0].name
      }

      const spawn: StructureSpawn = Game.spawns[context.spawn]

      if (!creep.pos.inRangeTo(spawn, 3)) {
        creep.moveTo(spawn)
      }

      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (!creep.pos.isNearTo(target)) {
      creep.moveTo(target)
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    creep.transfer(target, RESOURCE_ENERGY)

    delete context.target

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  getTransferTarget(creep: Creep, context: ICreepContext): StructureExtension | StructureTower | StructureSpawn | StructureStorage | null {
    if (context.target) {
      const target: StructureSpawn | StructureExtension | StructureStorage | null = Game.getObjectById(context.target)

      if (target) {
        return target
      }
    }

    const towers: StructureTower[] = (creep.room
      .find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity - 250
      }) as StructureTower[])
      .sort((t1: StructureTower, t2: StructureTower) => t1.energy - t2.energy)

    if (towers.length) {
      const tower = towers[0]

      context.target = tower.id

      return tower
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

  getEnergy(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep = Game.creeps[context.creepName]
    const source: Source | null = Game.getObjectById(context.source)

    if (source == null) {
      this.logger.error(`CreepSingleHauler:${context.creepName}: source does not exists`)

      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (!creep.pos.inRangeTo(source, 3)) {
      creep.moveTo(source)
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    const resources: Resource[] = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
      filter: r => r.resourceType === RESOURCE_ENERGY && r.amount >= 50
    })

    if (resources.length) {
      const resource = resources[0]

      if (creep.pos.isNearTo(resource)) {
        creep.pickup(resource)
      } else {
        creep.moveTo(resource)
      }
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}

