import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { ICreepContext } from './interfaces'

export class CreepSingleHauler extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep = Game.creeps[context.creepName]

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      return this.unshiftAndContinue(CreepSingleHaulerGetEnergy.name)
    }

    const target: StructureSpawn | StructureExtension | StructureStorage | StructureTower | null = this.findTransferTarget(creep, context)

    if (target) {
      return this.unshiftAndContinue(CreepSingleHaulerTransfer.name)
    }

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      return this.unshiftAndStop(CreepSingleHaulerGetEnergy.name)
    }

    const spawn = this.getSpawn(context)

    if (spawn && !creep.pos.inRangeTo(spawn, 3)) {
      creep.moveTo(spawn)
    }

    return this.waitNextTick()
  }

  getSpawn(context: ICreepContext): StructureSpawn | undefined {
    const creep = Game.creeps[context.creepName]

    let spawn: StructureSpawn | undefined = Game.spawns[context.spawn as string]

    if (spawn == null) {
      spawn = _.head(creep.room.find(FIND_MY_SPAWNS))
    }

    if (spawn) {
      context.spawn = spawn.name
    }

    return spawn
  }

  findTransferTarget(creep: Creep, context: ICreepContext): StructureExtension | StructureTower | StructureSpawn | StructureStorage | null {
    if (context.target) {
      const target: StructureSpawn | StructureExtension | StructureStorage | null = Game.getObjectById(context.target)

      if (target && target.store.getFreeCapacity(RESOURCE_ENERGY)) {
        return target
      }
    }

    const towers: StructureTower[] = creep.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER && s.store.getFreeCapacity(RESOURCE_ENERGY)
    }) as StructureTower[]

    const emptyTower = towers.find(tower => tower.store.getUsedCapacity(RESOURCE_ENERGY) as number < 250)

    if (emptyTower) {
      context.target = emptyTower.id

      return emptyTower
    }

    const extension: StructureExtension | null = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: (s: StructureExtension) => {
        return s.structureType === STRUCTURE_EXTENSION && s.store.getFreeCapacity(RESOURCE_ENERGY)
      }
    }) as StructureExtension | null

    if (extension) {
      context.target = extension.id
      return extension
    }

    const spawn: StructureSpawn | null = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
      filter: (s: StructureSpawn) => s.store.getFreeCapacity(RESOURCE_ENERGY)
    })

    if (spawn) {
      context.target = spawn.id
      return spawn
    }

    towers.sort((t1: StructureTower, t2: StructureTower) => (
      t2.store.getFreeCapacity(RESOURCE_ENERGY) as number) - (t1.store.getFreeCapacity(RESOURCE_ENERGY) as number)
    )

    if (towers.length) {
      const tower = towers[0]

      context.target = tower.id

      return tower
    }

    // if (creep.room.storage) {
    //   context.target = creep.room.storage.id
    //   return creep.room.storage
    // }

    return null
  }
}

export class CreepSingleHaulerTransfer extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]
    const target: StructureSpawn | StructureExtension | StructureStorage | StructureTower | null = Game.getObjectById(context.target)

    if (target == null || !target.store.getFreeCapacity(RESOURCE_ENERGY)) {
      delete context.target
      return this.shiftAndContinue()
    }

    if (!creep.pos.isNearTo(target)) {
      creep.moveTo(target)
      return this.waitNextTick()
    }

    creep.transfer(target, RESOURCE_ENERGY)

    delete context.target

    return this.shiftAndStop()
  }
}

export class CreepSingleHaulerGetEnergy extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep = Game.creeps[context.creepName]

    if (creep == null) {
      return this.shiftAndStop()
    }

    if (!creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      return this.shiftAndContinue()
    }

    const source: Source | null = Game.getObjectById(context.source)

    if (source == null) {
      this.logger.error(`CreepSingleHauler:${context.creepName}: source does not exists`)

      return this.shiftAndStop()
    }

    const resources: Resource[] = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
      filter: r => r.resourceType === RESOURCE_ENERGY
    })

    resources.sort((r1, r2) => r2.amount - r1.amount)

    const resource = _.head(resources)

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

