import { ActionsRegistry } from '../../core'
import { CreepAction } from './creep-action'
import { CreepRecycle } from './creep-recycle'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CreepStorager extends CreepAction {
  run(context: any) {
    this.context = context

    this.creep.say(`${Game.time % 10}`)

    // if no storage, no point in having a storager
    if (this.storage == null || !this.storage.isActive()) {
      return this.unshiftAndContinue(CreepRecycle.name)
    }

    // if empty and away from storage, move to storage and waitNextTick
    if (!this.hasEnergy && !this.isNearToStorage) {
      this.creep.travelTo(this.storage, { range: 1, ignoreCreeps: true })

      return this.waitNextTick()
    }

    // if no energy available, wait for haulers to collect some
    if (!this.hasEnergy && this.isNearToStorage && !this.storageHasEnergy) {
      return this.waitNextTick()
    }

    // try to refill whenever close to storager or terminal
    if (!this.isFull && this.isNearToStorage && this.storageHasEnergy) {
      this.creep.withdraw(this.storage, RESOURCE_ENERGY)
    } else if (this.terminal && !this.isFull && this.creep.pos.isNearTo(this.terminal) && this.terminal.store.getUsedCapacity(RESOURCE_ENERGY)) {
      this.creep.withdraw(this.terminal, RESOURCE_ENERGY)
    }

    const neighbors = utils.getNeighborsPositions(this.creep.pos, { range: 1, closeToExits: true })

    const anyResources = neighbors
      .map(pos => pos.lookFor(LOOK_RESOURCES))
      .flat()

    // if close to energy on the floor, collect it
    const energyOnTheFloor = anyResources.filter(r => r.resourceType === RESOURCE_ENERGY).sort((r1, r2) => r2.amount - r1.amount)

    if (!this.isFull && energyOnTheFloor.length) {
      this.creep.pickup(energyOnTheFloor[0])
    }

    const anyStructures = neighbors
      .map(pos => pos.lookFor(LOOK_STRUCTURES))
      .flat()

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

    const structures = anyStructures.filter(s => s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN) as (StructureSpawn | StructureExtension)[]

    const emptyStructures = structures.filter(s => s.store.getFreeCapacity(RESOURCE_ENERGY)).sort((s1, s2) => s2.store.getFreeCapacity(RESOURCE_ENERGY) - s1.store.getFreeCapacity(RESOURCE_ENERGY))

    // if close to an empty structure, transfer energy to it
    if (emptyStructures.length) {
      this.creep.transfer(emptyStructures[0], RESOURCE_ENERGY)
    }

    // if there is another empty structure nearby, wait to fill it next tick
    if (emptyStructures.length > 1) {
      return this.waitNextTick()
    }

    // if there is no empty structure near by (or just one, since this one will be filled above), start moving to the next one
    const nextStructure = this.creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      ignoreCreeps: true,
      range: 1,
      filter: s => {
        if (emptyStructures.length && s.id === emptyStructures[0].id) {
          return false
        }

        return (s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN) && s.store.getFreeCapacity(RESOURCE_ENERGY) && s.isActive()
      }
    })

    if (nextStructure) {
      this.creep.travelTo(nextStructure, { range: 1, ignoreCreeps: true })

      return this.waitNextTick()
    }

    // try to end filling towers
    const tower = this.creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      ignoreCreeps: true,
      range: 1,
      filter: s => s.structureType === STRUCTURE_TOWER && s.isActive() && s.store.getUsedCapacity(RESOURCE_ENERGY) as number < 500
    }) as StructureTower

    if (tower) {
      if (this.creep.pos.isNearTo(tower)) {
        this.creep.transfer(tower, RESOURCE_ENERGY)
      } else {
        this.creep.travelTo(tower, { range: 1, ignoreCreeps: true })
      }

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

    if (!this.isFull && !this.isNearToStorage) {
      this.creep.travelTo(this.storage, { range: 1, ignoreCreeps: true })
    }

    return this.waitNextTick()
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
