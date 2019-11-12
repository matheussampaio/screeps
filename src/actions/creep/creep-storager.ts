import * as _ from 'lodash'

import { ActionsRegistry, Action } from '../../core'

@ActionsRegistry.register
export class CreepStorager extends Action {
  protected context: any

  protected get creep(): Creep {
    return Game.creeps[this.context.creepName]
  }

  protected get room(): Room {
    return Game.rooms[this.creep.memory.roomName]
  }

  protected get controller(): StructureController | undefined {
    return this.room.controller
  }

  protected get storage(): StructureStorage | undefined {
    return this.room.storage
  }

  protected get terminal(): StructureTerminal | undefined {
    return this.room.terminal
  }

  run(context: any) {
    this.context = context

    if (this.storage == null) {
      return this.halt()
    }

    if (!this.creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
      return this.unshiftAndContinue(CreepStoragerGetEnergy.name)
    }

    const target: StructureSpawn | StructureExtension | StructureStorage | StructureTower | StructureContainer | null = this.findTransferTarget()

    if (target) {
      return this.unshiftAndContinue(CreepStoragerTransfer.name)
    }

    if (this.creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      return this.unshiftAndContinue(CreepStoragerGetEnergy.name)
    }

    if (
      this.terminal &&
      this.terminal.store.getUsedCapacity() <= TERMINAL_CAPACITY * 0.75 &&
      this.storage.store.getUsedCapacity() - this.storage.store.getUsedCapacity(RESOURCE_ENERGY)
    ) {
      return this.unshiftAndContinue(CreepStoragerTransferResourcesToTerminal.name)
    }

    return this.sleep(5)
  }

  findTransferTarget(): StructureExtension | StructureTower | StructureSpawn | StructureContainer | null {
    if (this.context.target) {
      const target: StructureSpawn | StructureExtension | null = Game.getObjectById(this.context.target)

      if (target && target.isActive() && target.store.getFreeCapacity(RESOURCE_ENERGY)) {
        return target
      }
    }

    const towers: StructureTower[] = this.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER && s.isActive() && s.store.getUsedCapacity(RESOURCE_ENERGY) as number < 500
    }) as StructureTower[]

    const emptyTower = towers.find(tower => tower.store.getUsedCapacity(RESOURCE_ENERGY) as number < 250)

    if (emptyTower) {
      this.context.target = emptyTower.id

      return emptyTower
    }

    const extension: StructureExtension | null = this.creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
      filter: (s: StructureExtension) => {
        return s.structureType === STRUCTURE_EXTENSION && s.isActive() && s.store.getFreeCapacity(RESOURCE_ENERGY)
      }
    }) as StructureExtension | null

    if (extension) {
      this.context.target = extension.id
      return extension
    }

    const spawn: StructureSpawn | null = this.creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
      filter: (s: StructureSpawn) => s.isActive() && s.store.getFreeCapacity(RESOURCE_ENERGY)
    })

    if (spawn) {
      this.context.target = spawn.id
      return spawn
    }

    towers.sort((t1: StructureTower, t2: StructureTower) => (
      t2.store.getFreeCapacity(RESOURCE_ENERGY) as number) - (t1.store.getFreeCapacity(RESOURCE_ENERGY) as number)
    )

    if (towers.length) {
      const tower = towers[0]

      this.context.target = tower.id

      return tower
    }

    if (this.room.controller) {
      const containers: StructureContainer[] = this.room.controller.pos.findInRange(FIND_STRUCTURES, 3, {
        filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY)
      }) as StructureContainer[]

      if (containers.length) {
        const container = containers[0]

        this.context.target = container.id

        return container
      }
    }

    return null
  }
}

@ActionsRegistry.register
export class CreepStoragerTransfer extends CreepStorager {
  run(context: any) {
    this.context = context

    const target: StructureSpawn | StructureExtension | StructureTower | null = Game.getObjectById(context.target)

    if (target == null || !target.store.getFreeCapacity(RESOURCE_ENERGY)) {
      delete this.context.target
      return this.shiftAndContinue()
    }

    // refill if close to storage
    if (this.storage && this.creep.store.getFreeCapacity(RESOURCE_ENERGY) && this.creep.pos.isNearTo(this.storage) && this.storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
      this.creep.withdraw(this.storage, RESOURCE_ENERGY)
    }

    if (!this.creep.pos.isNearTo(target)) {
      this.creep.travelTo(target, { range: 1 })
      return this.waitNextTick()
    }

    this.creep.transfer(target, RESOURCE_ENERGY)

    delete context.target

    return this.shiftAndStop()
  }
}

@ActionsRegistry.register
export class CreepStoragerGetEnergy extends CreepStorager {
  run(context: any) {
    this.context = context

    if (!this.creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      return this.shiftAndContinue()
    }

    if (this.storage == null || !this.storage.isActive() || !this.storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
      return this.waitNextTick()
    }

    if (this.creep.pos.isNearTo(this.storage)) {
      this.creep.withdraw(this.storage, RESOURCE_ENERGY)
    } else {
      this.creep.travelTo(this.storage, { range: 1 })
    }

    return this.waitNextTick()
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
        this.creep.travelTo(this.storage)
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
        this.creep.travelTo(this.storage)
      }

      return this.waitNextTick()
    }

    if (this.creep.pos.isNearTo(this.terminal)) {
      for (const resource in this.creep.store) {
        this.creep.transfer(this.terminal, resource as ResourceConstant)

        return this.shiftAndStop()
      }
    } else {
      this.creep.travelTo(this.terminal, { range: 1 })
    }

    return this.waitNextTick()
  }
}

