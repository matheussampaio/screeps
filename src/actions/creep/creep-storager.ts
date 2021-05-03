import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { CreepAction } from './creep-action'
import { CreepRecycle } from './creep-recycle'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CreepStorager extends CreepAction {
  run(context: any) {
    this.context = context

    // if no storage, no point in having a storager
    if (this.storage == null || !this.storage.isActive()) {
      return this.unshiftAndContinue(CreepRecycle.name)
    }

    const neighbors = utils.getNeighborsPositions(this.creep.pos, { range: 1, closeToExits: true })

    const anyResources = _.chain(neighbors)
      .map(pos => pos.lookFor(LOOK_RESOURCES))
      .flatten()
      .value()

    // if close to energy on the floor, collect it
    const energyOnTheFloor = anyResources
      .filter(r => r.resourceType === RESOURCE_ENERGY)
      .sort((r1, r2) => r2.amount - r1.amount)

    if (!this.isFull && energyOnTheFloor.length) {
      this.creep.pickup(energyOnTheFloor[0])
    }

    if (!this.hasEnergy) {
      this.clearAllReservesByThisCreep()

      // if empty and away from storage, move to storage and waitNextTick
      if (!this.isNearToStorage) {
        this.creep.travelTo(this.storage, { range: 1, ignoreCreeps: true })
        return this.waitNextTick()
      }

      // if no energy available, wait for haulers to collect some
      if (!this.storageHasEnergy) {
        return this.waitNextTick()
      }
    }

    // try to refill whenever close to storager or terminal
    if (!this.isFull && this.isNearToStorage && this.storageHasEnergy) {
      this.creep.withdraw(this.storage, RESOURCE_ENERGY)
    } else if (this.terminal && !this.isFull && this.creep.pos.isNearTo(this.terminal) && this.terminal.store.getUsedCapacity(RESOURCE_ENERGY)) {
      this.creep.withdraw(this.terminal, RESOURCE_ENERGY)
    }

    const anyStructures = _.chain(neighbors)
      .map(pos => pos.lookFor(LOOK_STRUCTURES))
      .flatten()
      .value()

    // if close to containers with energy, withdraw some
    if (!this.isFull) {
      const containers = anyStructures.filter(s => s.structureType === STRUCTURE_CONTAINER) as StructureContainer[]

      if (containers.length) {
        const container = containers.find(c => c.store.getUsedCapacity(RESOURCE_ENERGY))

        if (container) {
          this.creep.withdraw(container, RESOURCE_ENERGY)
        }
      }
    }

    const structures = anyStructures
      .filter(s => s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN) as (StructureSpawn | StructureExtension)[]

    const emptyStructures = structures
      .filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY))
      .sort((s1, s2) => s2.store.getFreeCapacity(RESOURCE_ENERGY) - s1.store.getFreeCapacity(RESOURCE_ENERGY))

    // if close to an empty structure, transfer energy to it
    if (emptyStructures.length) {
      this.creep.transfer(emptyStructures[0], RESOURCE_ENERGY)

      this.clearReserved(emptyStructures[0].id)
    }

    // if there is another empty structure nearby, wait to fill it next tick
    if (emptyStructures.length > 1) {
      return this.waitNextTick()
    }

    const target: StructureSpawn | StructureTower | StructureExtension | Creep | null = this.findTransferTarget()

    // if a target is found, move to it and refill it.
    if (target) {
      if (!this.creep.pos.isNearTo(target)) {
        this.creep.travelTo(target, { range: 1, ignoreCreeps: true })
        return this.waitNextTick()
      }

      this.creep.transfer(target, RESOURCE_ENERGY)

      this.clearReserved(target.id)

      delete this.context.target

      return this.waitNextTick()
    }

    // if everything is full, check if things can be moved to the terminal
    if (
      this.terminal &&
      this.terminal.store.getUsedCapacity() <= TERMINAL_CAPACITY * 0.75 &&
      this.storage.store.getUsedCapacity() - this.storage.store.getUsedCapacity(RESOURCE_ENERGY)
    ) {
      return this.unshiftAndContinue(CreepStoragerTransferResourcesToTerminal.name)
    }

    // if the creep is not full and nothing else to do, go refill and prep for the future.
    if (!this.isFull && !this.isNearToStorage) {
      this.creep.travelTo(this.storage, { range: 1, ignoreCreeps: true })

      return this.waitNextTick()
    }

    // if creep is full and nothing else to do, visit the spawn to renew the creep.
    if (this.isFull) {
      const spawn = this.creep.pos.findClosestByPath(FIND_MY_SPAWNS)

      if (spawn && !this.creep.pos.isNearTo(spawn)) {
        this.creep.travelTo(spawn, { range: 1, ignoreCreeps: true })
      }
    }

    return this.waitNextTick()
  }

  protected findTransferTarget(): StructureSpawn | StructureExtension | StructureTower | Creep | null {
    if (this.context.targets == null) {
      this.context.targets = []
    }

    if (this.context.target == null && this.context.targets.length) {
      this.context.targets = this.context.targets.map((id: string) => Game.getObjectById(id))
        .filter((obj: any) => obj != null && obj.store.getFreeCapacity(RESOURCE_ENERGY))
        .sort((o1: any, o2: any) => this.creep.pos.getRangeTo(o1.pos) - this.creep.pos.getRangeTo(o2.pos))
        .map((o1: any) => o1.id) as string[]

      this.context.target = this.context.targets.shift()
    }

    if (this.context.target) {
      const target: StructureTower | StructureSpawn | StructureExtension | Creep | null = Game.getObjectById(this.context.target)

      if (target && target.store.getFreeCapacity(RESOURCE_ENERGY)) {
        return target
      } else {
        this.clearReserved(this.context.target)
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

  protected clearAllReservesByThisCreep(): void {
    for (const id in this.room.memory.reserved) {
      if (this.room.memory.reserved[id] === this.creep.name) {
        delete this.room.memory.reserved[id]
      }
    }
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

  protected get hasEnergy(): boolean {
    return this.creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0
  }

  protected get isFull(): boolean {
    return !this.creep.store.getFreeCapacity()
  }

  protected get isNearToStorage(): boolean {
    if (this.storage == null) {
      return false
    }

    return this.creep.pos.isNearTo(this.storage)
  }

  protected get storageHasEnergy(): boolean {
    if (this.storage == null) {
      return false
    }

    return this.storage.store.getUsedCapacity(RESOURCE_ENERGY) > 0
  }
}

@ActionsRegistry.register
export class CreepStoragerTransferResourcesToTerminal extends CreepStorager {
  run(context: any) {
    this.context = context

    if (this.storage == null || this.terminal == null) {
      return this.shiftAndStop()
    }

    if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
      if (this.creep.pos.isNearTo(this.storage)) {
        this.creep.transfer(this.storage, RESOURCE_ENERGY)
      } else {
        this.creep.travelTo(this.storage, { range: 1, ignoreCreeps: true })
      }

      return this.waitNextTick()
    }

    if (!this.creep.store.getUsedCapacity()) {
      if (this.creep.pos.isNearTo(this.storage)) {
        for (const resource in this.storage.store) {
          if (resource === RESOURCE_ENERGY) {
            continue
          }

          this.creep.withdraw(this.storage, resource as ResourceConstant)
        }
      } else {
        this.creep.travelTo(this.storage, { range: 1, ignoreCreeps: true })
      }

      return this.waitNextTick()
    }

    if (this.creep.pos.isNearTo(this.terminal)) {
      for (const resource in this.creep.store) {
        this.creep.transfer(this.terminal, resource as ResourceConstant)

        return this.shiftAndStop()
      }
    } else {
      this.creep.travelTo(this.terminal, { range: 1, ignoreCreeps: true })
    }

    return this.waitNextTick()
  }
}
