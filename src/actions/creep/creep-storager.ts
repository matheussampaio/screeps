import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'

@ActionsRegistry.register
export class CreepStorager extends Action {
  run(context: any): [ACTIONS_RESULT, ...string[]] {
    const creep = Game.creeps[context.creepName]

    creep.say('S')

    if (creep.room.storage == null) {
      return this.halt()
    }

    if (!creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
      return this.unshiftAndContinue(CreepStoragerGetEnergy.name)
    }

    const target: StructureSpawn | StructureExtension | StructureStorage | StructureTower | StructureContainer | null = this.findTransferTarget(creep, context)

    if (target) {
      return this.unshiftAndContinue(CreepStoragerTransfer.name)
    }

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      return this.unshiftAndContinue(CreepStoragerGetEnergy.name)
    }

    return this.sleep(context, 5)
  }

  findTransferTarget(creep: Creep, context: any): StructureExtension | StructureTower | StructureSpawn | StructureContainer | null {
    if (context.target) {
      const target: StructureSpawn | StructureExtension | null = Game.getObjectById(context.target)

      if (target && target.isActive() && target.store.getFreeCapacity(RESOURCE_ENERGY)) {
        return target
      }
    }

    const towers: StructureTower[] = creep.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER && s.isActive() && s.store.getFreeCapacity(RESOURCE_ENERGY)
    }) as StructureTower[]

    const emptyTower = towers.find(tower => tower.store.getUsedCapacity(RESOURCE_ENERGY) as number < 250)

    if (emptyTower) {
      context.target = emptyTower.id

      return emptyTower
    }

    const extension: StructureExtension | null = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: (s: StructureExtension) => {
        return s.structureType === STRUCTURE_EXTENSION && s.isActive() && s.store.getFreeCapacity(RESOURCE_ENERGY)
      }
    }) as StructureExtension | null

    if (extension) {
      context.target = extension.id
      return extension
    }

    const spawn: StructureSpawn | null = creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
      filter: (s: StructureSpawn) => s.isActive() && s.store.getFreeCapacity(RESOURCE_ENERGY)
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

    if (creep.room.controller) {
      const containers: StructureContainer[] = creep.room.controller.pos.findInRange(FIND_STRUCTURES, 3, {
        filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY)
      }) as StructureContainer[]

      if (containers.length) {
        const container = containers[0]

        context.target = container.id

        return container
      }
    }

    return null
  }
}

@ActionsRegistry.register
export class CreepStoragerTransfer extends Action {
  run(context: any): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep | undefined = Game.creeps[context.creepName]
    const target: StructureSpawn | StructureExtension | StructureTower | null = Game.getObjectById(context.target)

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

@ActionsRegistry.register
export class CreepStoragerGetEnergy extends Action {
  run(context: any): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep = Game.creeps[context.creepName]
    const storage = creep.room.storage

    if (!creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      return this.shiftAndContinue()
    }

    if (storage == null || !storage.isActive() || !storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
      return this.waitNextTick()
    }

    if (creep.pos.isNearTo(storage)) {
      creep.withdraw(storage, RESOURCE_ENERGY)
    } else {
      creep.moveTo(storage)
    }

    return this.waitNextTick()
  }
}


