import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'
import { ICreepContext } from './interfaces'

@ActionsRegistry.register
export class CreepSingleHauler extends Action {
  run(context: ICreepContext): [ACTIONS_RESULT, ...string[]] {
    const creep = Game.creeps[context.creepName]

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      return this.unshiftAndContinue(CreepSingleHaulerGetEnergy.name)
    }

    const target: StructureSpawn | StructureExtension | StructureStorage | StructureTower | StructureContainer | null = this.findTransferTarget(creep, context)

    if (target) {
      return this.unshiftAndContinue(CreepSingleHaulerTransfer.name)
    }

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      return this.unshiftAndStop(CreepSingleHaulerGetEnergy.name)
    }

    if (creep.room.controller == null) {
      return this.waitNextTick()
    }

    if (creep.pos.inRangeTo(creep.room.controller, 2)) {
      creep.drop(RESOURCE_ENERGY)
    } else {
      creep.moveTo(creep.room.controller)
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

  findTransferTarget(creep: Creep, context: ICreepContext): StructureExtension | StructureTower | StructureSpawn | StructureStorage | StructureContainer | null {
    if (creep.room.storage && creep.room.storage.isActive() && creep.room.storage.store.getFreeCapacity(RESOURCE_ENERGY)) {
      context.target = creep.room.storage.id
      return creep.room.storage
    }

    if (context.target) {
      const target: StructureSpawn | StructureExtension | StructureStorage | null = Game.getObjectById(context.target)

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

@ActionsRegistry.register
export class CreepSingleHaulerGetEnergy extends Action {
  run(context: any): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep = Game.creeps[context.creepName]

    if (creep == null) {
      return this.shiftAndStop()
    }

    if (!creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      return this.shiftAndContinue()
    }

    let result = this.pickUpEnergy(context)

    if (result) {
      return result
    }

    return this.withdrawContainers(context)
  }

  pickUpEnergy(context: ICreepContext): [ACTIONS_RESULT, ...string[]] | null {
    const source: Source | null = Game.getObjectById(context.source)

    if (source == null) {
      return this.shiftAndStop()
    }

    const resources: Resource[] = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
      filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 50
    })

    resources.sort((r1, r2) => r2.amount - r1.amount)

    const resource = _.head(resources)

    if (resource == null) {
      return null
    }

    const creep: Creep = Game.creeps[context.creepName]

    if (creep.pos.isNearTo(resource)) {
      creep.pickup(resource)
    } else {
      creep.moveTo(resource)
    }

    return this.waitNextTick()
  }

  withdrawContainers(context: any): [ACTIONS_RESULT, ...string[]] {
    const creep: Creep = Game.creeps[context.creepName]

    const container = this.getContainer(context)

    if (container == null) {
      return this.waitNextTick()
    }

    if (!creep.pos.isNearTo(container)) {
      creep.moveTo(container)
      return this.waitNextTick()
    }

    const containerUsedCapacity = container.store.getUsedCapacity(RESOURCE_ENERGY) as number
    const containerFreeCapacity = container.store.getFreeCapacity(RESOURCE_ENERGY) as number
    const creepFreeCapacity = creep.store.getFreeCapacity(RESOURCE_ENERGY) as number

    if (containerFreeCapacity && containerUsedCapacity < creepFreeCapacity) {
      return this.waitNextTick()
    }

    creep.withdraw(container, RESOURCE_ENERGY)

    return this.waitNextTick()
  }

  getContainer(context: any): StructureContainer | null {
    let container: StructureContainer | null = Game.getObjectById(context.container)

    if (container != null) {
      return container
    }

    const creep = Game.creeps[context.creepName]
    const { x, y } = context.containerPos

    const pos = creep.room.getPositionAt(x, y) as RoomPosition

    container = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER) as StructureContainer

    if (container) {
      context.container = container.id
    }

    return container
  }
}

