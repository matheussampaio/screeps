import * as _ from 'lodash'

import { ActionsRegistry, Action } from '../../core'

@ActionsRegistry.register
export class CreepLink extends Action {
  private context: any

  run(context: any) {
    this.context = context

    if (this.storage == null) {
      return this.sleep(5)
    }

    if (this.creep == null || this.creep.spawning) {
      return this.sleep(5)
    }

    const link = this.getStorageLink()

    if (link == null) {
      return this.sleep(5)
    }

    if (!this.creep.pos.isNearTo(link)) {
      this.creep.travelTo(link)
      return this.waitNextTick()
    }

    if (!this.creep.pos.isNearTo(this.storage)) {
      this.creep.travelTo(this.storage)
      return this.waitNextTick()
    }

    if (!this.creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      this.creep.transfer(this.storage, RESOURCE_ENERGY)
      return this.waitNextTick()
    }

    if (link.store.getUsedCapacity(RESOURCE_ENERGY)) {
      this.creep.withdraw(link, RESOURCE_ENERGY)
      return this.waitNextTick()
    }

    if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
      this.creep.transfer(this.storage, RESOURCE_ENERGY)
      return this.waitNextTick()
    }

    return this.waitNextTick()
  }

  private get creep(): Creep {
    return Game.creeps[this.context.creepName]
  }

  private get room(): Room {
    return Game.rooms[this.creep.memory.roomName]
  }

  protected get storage(): StructureStorage | undefined {
    return this.room.storage
  }

  private getStorageLink(): StructureLink | null {
    return Game.getObjectById(this.context.link)
  }
}
