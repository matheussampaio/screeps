import * as _ from 'lodash'

import { ActionsRegistry, Action } from '../../core'
import { ICreepContext } from './interfaces'

@ActionsRegistry.register
export class CreepRecycler extends Action {
  protected context: any

  run(context: any) {
    this.context = context

    if (this.storage == null || !this.storage.store.getFreeCapacity()) {
      return this.sleep(5)
    }

    if (!this.creep.store.getFreeCapacity()) {
      return this.unshiftAndContinue(CreepRecyclerTransfer.name)
    }

    const tombstone = this.creep.pos.findClosestByPath(FIND_TOMBSTONES, {
      filter: t => t.store.getUsedCapacity()
    })

    if (tombstone) {
      this.context.target = tombstone.id as string

      return this.unshiftAndContinue(CreepRecyclerGetResourceFromTombstone.name)
    }

    const ruin = this.creep.pos.findClosestByPath(FIND_RUINS, {
      filter: r => r.store.getUsedCapacity()
    })

    if (ruin) {
      this.context.target = ruin.id as string

      return this.unshiftAndContinue(CreepRecyclerGetResourceFromTombstone.name)
    }

    const resource = this.creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES)

    if (resource) {
      this.context.target = resource.id

      return this.unshiftAndContinue(CreepRecyclerGetResource.name)
    }

    if (this.creep.store.getUsedCapacity()) {
      return this.unshiftAndContinue(CreepRecyclerTransfer.name)
    }

    this.creep.suicide()

    return this.halt()
  }

  protected get creep(): Creep {
    return Game.creeps[this.context.creepName]
  }

  protected get room(): Room {
    return Game.rooms[this.creep.memory.roomName]
  }

  protected get storage(): StructureStorage | undefined {
    return this.room.storage
  }
}

@ActionsRegistry.register
export class CreepRecyclerGetResource extends CreepRecycler {
  run(context: ICreepContext): any {
    this.context = context

    if (!this.creep.store.getFreeCapacity()) {
      return this.shiftAndContinue()
    }

    const target = Game.getObjectById(this.context.target) as Resource

    if (target == null) {
      delete this.context.target
      return this.shiftAndContinue()
    }

    if (!target.amount) {
      delete this.context.target
      return this.shiftAndContinue()
    }

    if (!this.creep.pos.isNearTo(target)) {
      this.creep.travelTo(target)
      return this.waitNextTick()
    }

    this.creep.pickup(target)
    delete this.context.target

    return this.waitNextTick()
  }
}

@ActionsRegistry.register
export class CreepRecyclerGetResourceFromTombstone extends CreepRecycler {
  run(context: ICreepContext): any {
    this.context = context

    if (!this.creep.store.getFreeCapacity()) {
      return this.shiftAndContinue()
    }

    const target = Game.getObjectById(this.context.target) as Tombstone

    if (target == null) {
      delete this.context.target
      return this.shiftAndContinue()
    }

    if (!target.store.getUsedCapacity()) {
      delete this.context.target
      return this.shiftAndContinue()
    }

    if (!this.creep.pos.isNearTo(target)) {
      this.creep.travelTo(target)
      return this.waitNextTick()
    }

    for (const resource in target.store) {
      this.creep.withdraw(target, resource as ResourceConstant)

      return this.waitNextTick()
    }

    return this.waitNextTick()
  }
}

@ActionsRegistry.register
export class CreepRecyclerTransfer extends CreepRecycler {
  run(context: ICreepContext): any {
    this.context = context

    if (this.storage == null || !this.storage.store.getFreeCapacity()) {
      return this.waitNextTick()
    }

    if (!this.creep.store.getUsedCapacity()) {
      return this.shiftAndContinue()
    }

    if (!this.creep.pos.isNearTo(this.storage)) {
      this.creep.travelTo(this.storage)
      return this.waitNextTick()
    }

    for (const resource in this.creep.store) {
      this.creep.transfer(this.storage, resource as ResourceConstant)

      return this.waitNextTick()
    }

    return this.waitNextTick()
  }
}
