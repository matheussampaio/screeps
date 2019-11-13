import * as _ from 'lodash'

import { ActionsRegistry, Action } from '../../core'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CreepLink extends Action {
  protected context: any

  run(context: any) {
    this.context = context

    if (this.creep == null || this.storage == null || this.link == null) {
      this.creep.suicide()

      return this.halt()
    }

    if (this.creep.spawning) {
      return this.waitNextTick()
    }

    if (!this.creep.pos.isNearTo(this.link) || !this.creep.pos.isNearTo(this.storage)) {
      return this.unshiftAndContinue(CreepLinkMoveToPosition.name)
    }

    if (this.creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
      this.creep.transfer(this.storage, RESOURCE_ENERGY)
      return this.waitNextTick()
    }

    if (this.link.store.getUsedCapacity(RESOURCE_ENERGY)) {
      this.creep.withdraw(this.link, RESOURCE_ENERGY)
      return this.waitNextTick()
    }

    return this.waitNextTick()
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

  protected get link(): StructureLink | null {
    return Game.getObjectById(this.context.link)
  }
}

@ActionsRegistry.register
export class CreepLinkMoveToPosition extends CreepLink {
  run(context: any) {
    this.context = context

    if (this.creep == null || this.storage == null || this.link == null) {
      this.creep.suicide()

      return this.halt()
    }

    if (this.creep.spawning) {
      return this.waitNextTick()
    }

    if (this.creep.pos.isNearTo(this.link) && this.creep.pos.isNearTo(this.storage)) {
      return this.shiftAndContinue()
    }

    const pos = this.getTargetPosition()

    if (pos == null) {
      this.logger.error(`Can't find a position closer to Link and Storager`)

      return this.waitNextTick()
    }

    this.creep.moveTo(pos)

    return this.waitNextTick()
  }

  private getTargetPosition(): RoomPosition | null {
    const pos = this.getTargetCoord()

    if (pos == null) {
      this.logger.error(`Can't find a position closer to Link and Storager`)

      return null
    }

    return this.room.getPositionAt(pos.x, pos.y)
  }

  private getTargetCoord(): { x: number, y: number } | null {
    if (this.link == null || this.storage == null) {
      return null
    }

    const neighborsToLink = utils.getNeighborsCoords(this.link.pos.x, this.link.pos.y)
    const neighborsToStorage = utils.getNeighborsCoords(this.storage.pos.x, this.storage.pos.y)

    for (const p1 of neighborsToLink) {
      for (const p2 of neighborsToStorage) {
        if (p1.x === p2.x && p1.y === p2.y) {
          return p1
        }
      }
    }

    return null
  }
}
