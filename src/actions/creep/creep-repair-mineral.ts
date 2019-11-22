import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { CreepAction } from './creep-action'
import { CreepRecycle } from './creep-recycle'

@ActionsRegistry.register
export class CreepRepairMineral extends CreepAction {
  run(context: any) {
    this.context = context

    if (this.context.containerPos == null || this.storage == null) {
      return this.unshiftAndContinue(CreepRecycle.name)
    }

    const { x, y } = this.context.containerPos

    const pos = this.room.getPositionAt(x, y) as RoomPosition

    const container = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER) as StructureContainer

    if (container == null || container.hits === container.hitsMax) {
      return this.unshiftAndContinue(CreepRecycle.name)
    }

    if (!this.creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
      if (this.storage.store.getUsedCapacity(RESOURCE_ENERGY) <= 5000) {
        return this.waitNextTick()
      }

      if (this.creep.pos.isNearTo(this.storage)) {
        this.creep.withdraw(this.storage, RESOURCE_ENERGY)
      } else {
        this.creep.travelTo(this.storage, { range: 1, ignoreCreeps: true })
      }

      return this.waitNextTick()
    }

    if (this.creep.pos.inRangeTo(container, 3)) {
      this.creep.repair(container)
    } else {
      this.creep.travelTo(container, { range: 3, ignoreCreeps: true })
    }

    return this.waitNextTick()
  }
}

