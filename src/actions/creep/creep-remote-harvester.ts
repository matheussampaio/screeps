import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { CreepAction } from './creep-action'
import { CreepRecycle } from './creep-recycle'

@ActionsRegistry.register
export class CreepRemoteHarvester extends CreepAction {
  run(context: any) {
    this.context = context

    const source: Source | null = Game.getObjectById(this.context.source)

    if (this.context.remoteRoom && this.context.remoteRoom !== this.creep.room.name) {
      const pos = new RoomPosition(25, 25, this.context.remoteRoom)

      this.creep.travelTo(pos, { range: 23, ignoreCreeps: true })

      return this.waitNextTick()
    }

    if (source == null) {
      return this.unshiftAndContinue(CreepRecycle.name)
    }

    if (this.context.containerPos != null) {
      const result = this.maintainContainer()

      if (result != null) {
        return result
      }
    }

    // walk to source
    if (!this.creep.pos.isNearTo(source)) {
      this.creep.travelTo(source, { range: 1, ignoreCreeps: true })

      return this.waitNextTick()
    }

    // harvest the source
    if (source.energy) {
      this.creep.harvest(source)
    }

    return this.waitNextTick()
  }

  private maintainContainer() {
    const container: StructureContainer | ConstructionSite | null = Game.getObjectById(this.context.container)

    // try to create or find an existing container
    if (container == null) {
      this.findStructure(this.context.containerPos, STRUCTURE_CONTAINER, 'container', true)
      return this.waitNextTick()
    }

    // try to build container every 11th tick
    if (Game.time % 2 === 0 && container instanceof ConstructionSite && this.canBuildStructures()) {
      try { this.creep.cancelOrder('harvest') } catch {}
      this.creep.build(container)
    }

    // try to move on top of container every 10 ticks
    if (!this.creep.pos.isEqualTo(container) && !container.pos.lookFor(LOOK_CREEPS).length) {
      this.creep.travelTo(container, { ignoreCreeps: true })

      return this.waitNextTick()
    }

    // repair container every 95 ticks
    if (Game.time % 2 === 0 && container instanceof StructureContainer && container.hits < container.hitsMax - 5000 && this.canBuildStructures()) {
      try { this.creep.cancelOrder('harvest') } catch {}
      this.creep.repair(container)
    }

    // if not on top of container, try to transfer to it
    if (container instanceof StructureContainer && !this.creep.pos.isEqualTo(container) && this.creep.pos.isNearTo(container) && container.store.getFreeCapacity(RESOURCE_ENERGY) as number && this.creep.store.getFreeCapacity() as number < this.creep.getActiveBodyparts(WORK) * 2) {
      this.creep.transfer(container, RESOURCE_ENERGY)
    }

    return null
  }

  private canBuildStructures(): boolean {
    const energyNeeded = Math.min(this.creep.store.getCapacity(), this.creep.getActiveBodyparts(WORK) * BUILD_POWER)

    return !!(
      this.creep.getActiveBodyparts(WORK) &&
      this.creep.getActiveBodyparts(CARRY) &&
      this.creep.store.getUsedCapacity(RESOURCE_ENERGY) >= energyNeeded
    )
  }

  private findStructure(hasPos: { x: number, y: number }, structureType: BuildableStructureConstant, prop: string, create: boolean = false): void {
    const pos = this.creep.room.getPositionAt(hasPos.x, hasPos.y) as RoomPosition

    const structure = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === structureType)

    if (structure) {
      this.context[prop] = structure.id

      return
    }

    const constructionSite = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(c => c.structureType === structureType)

    if (constructionSite) {
      this.context[prop] = constructionSite.id

      return
    }

    if (create) {
      this.creep.room.createConstructionSite(hasPos.x, hasPos.y, structureType)
    }

    return
  }
}
