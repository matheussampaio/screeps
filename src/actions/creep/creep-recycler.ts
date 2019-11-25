import { ActionsRegistry } from '../../core'
import { ICreepContext } from './interfaces'
import { CreepAction } from './creep-action'

@ActionsRegistry.register
export class CreepRecycler extends CreepAction {
  run(context: any) {
    this.context = context

    if (this.storage == null || !this.storage.store.getFreeCapacity()) {
      return this.sleep(5)
    }

    if (!this.creep.store.getFreeCapacity()) {
      return this.unshiftAndContinue(CreepRecyclerTransfer.name)
    }

    const tombstones = this.room.find(FIND_TOMBSTONES, {
      filter: t => t.store.getUsedCapacity()
    })

    if (tombstones.length) {
      this.context.target = tombstones[0].id as string

      return this.unshiftAndContinue(CreepRecyclerGetResourceFromTombstone.name)
    }

    const ruins = this.room.find(FIND_RUINS, {
      filter: r => r.store.getUsedCapacity()
    })

    if (ruins.length) {
      this.context.target = ruins[0].id as string

      return this.unshiftAndContinue(CreepRecyclerGetResourceFromTombstone.name)
    }

    const resources = this.room.find(FIND_DROPPED_RESOURCES)

    if (resources.length) {
      this.context.target = resources[0].id

      return this.unshiftAndContinue(CreepRecyclerGetResource.name)
    }

    if (this.creep.store.getUsedCapacity()) {
      return this.unshiftAndContinue(CreepRecyclerTransfer.name)
    }

    return this.sleep(25)
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
      this.creep.travelTo(target, { range: 1, ignoreCreeps: true })
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
      this.creep.travelTo(target, { range: 1, ignoreCreeps: true })
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
      this.creep.travelTo(this.storage, { range: 1, ignoreCreeps: true })
      return this.waitNextTick()
    }

    for (const resource in this.creep.store) {
      this.creep.transfer(this.storage, resource as ResourceConstant)

      return this.waitNextTick()
    }

    return this.waitNextTick()
  }
}
