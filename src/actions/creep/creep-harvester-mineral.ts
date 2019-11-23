import * as _ from 'lodash'

import { ActionsRegistry, Action } from '../../core'
import { CreepRecycle } from './creep-recycle'

@ActionsRegistry.register
export class CreepHarvesterMineral extends Action {
  private context: any

  run(context: any) {
    this.context = context

    const mineral: Mineral | null = Game.getObjectById(this.context.mineral)

    // if storage is full, wait
    if (this.storage == null || this.storage.store.getUsedCapacity() >= STORAGE_CAPACITY * 0.8) {
      return this.unshiftAndContinue(CreepRecycle.name)
    }

    if (mineral == null) {
      this.logger.error(`CreepHarvesterMineral:${this.context.creepName}: mineral does not exists`)

      return this.halt()
    }

    if (!this.creep.pos.isNearTo(mineral)) {
      this.creep.travelTo(mineral, { range: 1, ignoreCreeps: true })

      return this.waitNextTick()
    }

    const extractor: StructureExtractor | null = Game.getObjectById(this.context.extractor)

    if (extractor == null) {
      return this.waitNextTick()
    }

    if (!extractor.cooldown && mineral.mineralAmount) {
      this.creep.harvest(mineral)
    }

    // try to move on top of container every 10 ticks
    if (Game.time % 12 === 0 && this.context.containerPos) {
      const { x, y } =  this.context.containerPos
      const pos = this.room.getPositionAt(x, y) as RoomPosition

      if (!this.creep.pos.isEqualTo(pos) && !pos.lookFor(LOOK_CREEPS).length) {
        this.creep.travelTo(pos, { ignoreCreeps: true })
      }
    }

    this.creep.memory.avoidMoving = true

    return this.waitNextTick()
  }

  private get creep(): Creep {
    return Game.creeps[this.context.creepName]
  }

  private get room(): Room {
    return Game.rooms[this.creep.memory.roomName]
  }

  private get storage(): StructureStorage | undefined {
    return this.room.storage
  }
}

