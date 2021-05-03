import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { ICreepContext } from './interfaces'
import { CreepAction } from './creep-action'

@ActionsRegistry.register
export class CreepSingleHauler extends CreepAction {
  run(context: ICreepContext) {
    this.context = context

    if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
      for (const id in this.room.memory.reserved) {
        if (this.room.memory.reserved[id] === this.creep.name) {
          delete this.room.memory.reserved[id]
        }
      }

      return this.unshiftAndContinue(CreepSingleHaulerGetEnergy.name)
    }

    const target: StructureSpawn | StructureExtension | StructureStorage | StructureTower | StructureContainer | Creep | null = this.findTransferTarget()

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

  findTransferTarget(): StructureExtension | StructureTower | StructureSpawn | StructureStorage | StructureContainer | Creep | null {
    if (this.storage && this.storage.isActive() && this.storage.store.getFreeCapacity(RESOURCE_ENERGY)) {
      this.context.target = this.storage.id as string
      return this.storage
    }

    if (this.context.targets == null) {
      this.context.targets = []
    }

    if (this.context.target == null && this.context.targets.length) {
      this.context.targets = this.context.targets.map((id: string) => Game.getObjectById(id))
        .filter((obj: any) => obj != null)
        .sort((o1: any, o2: any) => this.creep.pos.getRangeTo(o1.pos) - this.creep.pos.getRangeTo(o2.pos))
        .map((o1: any) => o1.id) as string[]

      this.context.target = this.context.targets.shift()
    }

    if (this.context.target) {
      const target: StructureSpawn | StructureExtension | null = Game.getObjectById(this.context.target)

      if (target && target.store.getFreeCapacity(RESOURCE_ENERGY)) {
        return target
      }
    }

    let energyAvailable: number = this.creep.store.getUsedCapacity(RESOURCE_ENERGY)

    const towers: StructureTower[] = this.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER && s.my && s.isActive() && s.store.getFreeCapacity(RESOURCE_ENERGY) && !this.isReserved(s.id) && this.creep.pos.getRangeTo(s.pos) <= 25
    }) as StructureTower[]

    const emptyTowers = towers.filter(tower => tower.store.getUsedCapacity(RESOURCE_ENERGY) as number < 250)
      .sort((t1, t2) => this.creep.pos.getRangeTo(t1) - this.creep.pos.getRangeTo(t2))

    for (let i = 0; i < emptyTowers.length && energyAvailable; i++) {
      const tower = emptyTowers[i]

      this.context.targets.push(tower.id)

      this.markReserved(tower.id)

      energyAvailable -= tower.store.getFreeCapacity(RESOURCE_ENERGY)
    }

    if (!energyAvailable) {
      this.context.target = this.context.targets.shift()

      return Game.getObjectById(this.context.target)
    }

    const extensions = this.room.find(FIND_MY_STRUCTURES, {
      filter: (s: StructureExtension) => {
        return s.structureType === STRUCTURE_EXTENSION && s.my && s.isActive() && s.store.getFreeCapacity(RESOURCE_ENERGY) && !this.isReserved(s.id) && this.creep.pos.getRangeTo(s.pos) <= 25
      }
    }) as StructureExtension[]

    extensions.sort((e1, e2) => this.creep.pos.getRangeTo(e1) - this.creep.pos.getRangeTo(e2))

    for (let i = 0; i < extensions.length && energyAvailable; i++) {
      const extension = extensions[i]

      this.context.targets.push(extension.id)

      this.markReserved(extension.id)

      energyAvailable -= extension.store.getFreeCapacity(RESOURCE_ENERGY)
    }

    if (!energyAvailable) {
      this.context.target = this.context.targets.shift()

      return Game.getObjectById(this.context.target)
    }

    const spawns = this.room.find(FIND_MY_SPAWNS, {
      filter: (s: StructureSpawn) => s.my && s.isActive() && s.store.getFreeCapacity(RESOURCE_ENERGY) && !this.isReserved(s.id) && this.creep.pos.getRangeTo(s.pos) <= 25
    }) as StructureSpawn[]

    spawns.sort((e1, e2) => this.creep.pos.getRangeTo(e1) - this.creep.pos.getRangeTo(e2))

    for (let i = 0; i < spawns.length && energyAvailable; i++) {
      const spawn = spawns[i]

      this.context.targets.push(spawn.id)

      this.markReserved(spawn.id)

      energyAvailable -= spawn.store.getFreeCapacity(RESOURCE_ENERGY)
    }

    if (!energyAvailable) {
      this.context.target = this.context.targets.shift()

      return Game.getObjectById(this.context.target)
    }

    const creeps = this.room.find(FIND_MY_CREEPS, {
      filter: (c: Creep) => c.my && c.name.includes('builder') && !this.isReserved(c.id) && c.store.getFreeCapacity(RESOURCE_ENERGY) && this.creep.pos.getRangeTo(c.pos) <= 25
    }) as Creep[]

    creeps.sort((e1, e2) => this.creep.pos.getRangeTo(e1) - this.creep.pos.getRangeTo(e2))

    for (let i = 0; i < creeps.length && energyAvailable; i++) {
      const creep = creeps[i]

      this.context.targets.push(creep.id)

      this.markReserved(creep.id)

      energyAvailable -= creep.store.getFreeCapacity(RESOURCE_ENERGY)
    }

    if (!energyAvailable) {
      this.context.target = this.context.targets.shift()

      return Game.getObjectById(this.context.target)
    }

    const halfEmptyTowers = towers.filter(tower => tower.store.getUsedCapacity(RESOURCE_ENERGY) as number > 250 && tower.store.getFreeCapacity(RESOURCE_ENERGY) >= 100)
      .sort((t1, t2) => this.creep.pos.getRangeTo(t1) - this.creep.pos.getRangeTo(t2))

    for (let i = 0; i < halfEmptyTowers.length && energyAvailable; i++) {
      const tower = halfEmptyTowers[i]

      this.context.targets.push(tower.id)

      this.markReserved(tower.id)

      energyAvailable -= tower.store.getFreeCapacity(RESOURCE_ENERGY)
    }

    if (this.context.targets.length) {
      this.context.target = this.context.targets.shift()

      return Game.getObjectById(this.context.target)
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

  protected isReserved(id: string): boolean {
    if (this.room.memory.reserved == null) {
      this.room.memory.reserved = {}
    }

    const reservedBy = this.room.memory.reserved[id]
    const reservedExists = Game.creeps[reservedBy] != null
    const isReservedByAnotherCreep = reservedBy !== this.creep.id

    return reservedBy != null && reservedExists && isReservedByAnotherCreep
  }

  protected markReserved(id: string): void {
    if (this.room.memory.reserved == null) {
      this.room.memory.reserved = {}
    }

    this.room.memory.reserved[id] = this.creep.name
  }

  protected clearReserved(id: string): void {
    if (this.room.memory.reserved == null) {
      this.room.memory.reserved = {}
    }

    delete this.room.memory.reserved[id]
  }
}

@ActionsRegistry.register
export class CreepSingleHaulerTransfer extends CreepSingleHauler {
  run(context: ICreepContext) {
    this.context = context

    const target: StructureSpawn | StructureExtension | StructureStorage | StructureTower | Creep | null = Game.getObjectById(this.context.target as string)

    if (target == null || !target.store.getFreeCapacity(RESOURCE_ENERGY)) {
      delete this.context.target

      if (target != null) {
        this.clearReserved(target.id)
      }

      return this.shiftAndContinue()
    }

    if (!this.creep.pos.isNearTo(target)) {
      this.creep.travelTo(target, { range: 1, ignoreCreeps: true })
      return this.waitNextTick()
    }

    this.creep.transfer(target, RESOURCE_ENERGY)

    this.clearReserved(target.id)

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

