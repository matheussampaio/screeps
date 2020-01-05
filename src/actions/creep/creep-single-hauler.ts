import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { ICreepContext } from './interfaces'
import { CreepAction } from './creep-action'

@ActionsRegistry.register
export class CreepSingleHauler extends CreepAction {
  run(context: ICreepContext) {
    this.context = context

    if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      return this.unshiftAndContinue(CreepSingleHaulerGetEnergy.name)
    }

    const target: StructureSpawn | StructureExtension | StructureStorage | StructureTower | StructureContainer | null = this.findTransferTarget()

    if (target) {
      return this.unshiftAndContinue(CreepSingleHaulerTransfer.name)
    }

    if (this.creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      return this.unshiftAndStop(CreepSingleHaulerGetEnergy.name)
    }

    if (this.controller == null) {
      return this.waitNextTick()
    }

    if (this.creep.pos.inRangeTo(this.controller, 3)) {
      this.creep.drop(RESOURCE_ENERGY)
    } else {
      this.creep.travelTo(this.controller, { range: 3, ignoreCreeps: true })
    }

    return this.waitNextTick()
  }

  findTransferTarget(): StructureExtension | StructureTower | StructureSpawn | StructureStorage | StructureContainer | null {
    if (this.storage && this.storage.isActive() && this.storage.store.getFreeCapacity(RESOURCE_ENERGY)) {
      this.context.target = this.storage.id as string
      return this.storage
    }

    if (this.context.target) {
      const target: StructureSpawn | StructureExtension | StructureStorage | null = Game.getObjectById(this.context.target)

      if (target && target.isActive() && target.store.getFreeCapacity(RESOURCE_ENERGY)) {
        return target
      }
    }

    const towers: StructureTower[] = this.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER && s.isActive() && s.store.getFreeCapacity(RESOURCE_ENERGY)
    }) as StructureTower[]

    const emptyTower = towers.find(tower => tower.store.getUsedCapacity(RESOURCE_ENERGY) as number < 250)

    if (emptyTower) {
      this.context.target = emptyTower.id as string

      return emptyTower
    }

    const extension: StructureExtension | null = this.creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: (s: StructureExtension) => {
        return s.structureType === STRUCTURE_EXTENSION && s.isActive() && s.store.getFreeCapacity(RESOURCE_ENERGY)
      }
    }) as StructureExtension | null

    if (extension) {
      this.context.target = extension.id as string
      return extension
    }

    const spawn: StructureSpawn | null = this.creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
      filter: (s: StructureSpawn) => s.isActive() && s.store.getFreeCapacity(RESOURCE_ENERGY)
    })

    if (spawn) {
      this.context.target = spawn.id as string
      return spawn
    }

    towers.sort((t1: StructureTower, t2: StructureTower) => (
      t2.store.getFreeCapacity(RESOURCE_ENERGY) as number) - (t1.store.getFreeCapacity(RESOURCE_ENERGY) as number)
    )

    if (towers.length) {
      const tower = towers[0]

      this.context.target = tower.id as string

      return tower
    }

    if (this.controller) {
      const containers: StructureContainer[] = this.controller.pos.findInRange(FIND_STRUCTURES, 3, {
        filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY)
      }) as StructureContainer[]

      if (containers.length) {
        const container = containers[0]

        this.context.target = container.id as string

        return container
      }
    }

    return null
  }
}

@ActionsRegistry.register
export class CreepSingleHaulerTransfer extends CreepSingleHauler {
  run(context: ICreepContext) {
    this.context = context

    const target: StructureSpawn | StructureExtension | StructureStorage | StructureTower | null = Game.getObjectById(this.context.target as string)

    if (target == null || !target.store.getFreeCapacity(RESOURCE_ENERGY)) {
      delete this.context.target
      return this.shiftAndContinue()
    }

    if (!this.creep.pos.isNearTo(target)) {
      this.creep.travelTo(target, { range: 1, ignoreCreeps: true })
      return this.waitNextTick()
    }

    this.creep.transfer(target, RESOURCE_ENERGY)

    delete this.context.target

    return this.shiftAndStop()
  }
}

@ActionsRegistry.register
export class CreepSingleHaulerGetEnergy extends CreepSingleHauler {
  run(context: any) {
    this.context = context

    if (this.creep == null) {
      return this.shiftAndStop()
    }

    if (!this.creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      return this.shiftAndContinue()
    }

    let result = this.pickUpEnergy()

    if (result) {
      return result
    }

    return this.withdrawContainers()
  }

  pickUpEnergy() {
    const source: Source | null = Game.getObjectById(this.context.source as string)

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

    if (this.creep.pos.isNearTo(resource)) {
      this.creep.pickup(resource)
    } else {
      this.creep.travelTo(resource, { range: 1, ignoreCreeps: true })
    }

    return this.waitNextTick()
  }

  withdrawContainers() {
    const container = this.getContainer()

    if (container == null) {
      return this.waitNextTick()
    }

    if (!this.creep.pos.isNearTo(container)) {
      this.creep.travelTo(container, { range: 1, ignoreCreeps: true })
      return this.waitNextTick()
    }

    const containerUsedCapacity = container.store.getUsedCapacity(RESOURCE_ENERGY) as number
    const containerFreeCapacity = container.store.getFreeCapacity(RESOURCE_ENERGY) as number
    const creepFreeCapacity = this.creep.store.getFreeCapacity(RESOURCE_ENERGY) as number

    if (containerFreeCapacity && containerUsedCapacity < creepFreeCapacity) {
      return this.waitNextTick()
    }

    this.creep.withdraw(container, RESOURCE_ENERGY)

    return this.waitNextTick()
  }

  getContainer(): StructureContainer | null {
    let container: StructureContainer | null = Game.getObjectById(this.context.container)

    if (container != null) {
      return container
    }

    const { x, y, roomName } = this.context.containerPos

    const pos = new RoomPosition(x, y, roomName)

    container = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER) as StructureContainer

    if (container) {
      this.context.container = container.id
    }

    return container
  }
}

