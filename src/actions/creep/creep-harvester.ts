import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { CreepAction } from './creep-action'
import { CreepRecycle } from './creep-recycle'

@ActionsRegistry.register
export class CreepHarvester extends CreepAction {
  run(context: any) {
    this.context = context

    const source: Source | null = Game.getObjectById(this.context.source)

    // if source doesn't exist, something is really wrong. :(
    if (source == null) {
      if (this.context.remoteRoom && this.context.remoteRoom !== this.creep.room.name) {
        const pos = new RoomPosition(25, 25, this.context.remoteRoom)

        this.creep.travelTo(pos, { range: 23, ignoreCreeps: true })

        return this.waitNextTick()
      }

      this.logger.error(`CreepHarvester:${this.context.creepName}: source does not exists`)

      return this.unshiftAndContinue(CreepRecycle.name)
    }

    if (this.context.linkPos != null) {
      const result = this.maintainLink()

      if (result != null) {
        return result
      }
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

    this.creep.memory.avoidMoving = true

    // harvest the source
    if (source.energy) {
      this.creep.harvest(source)
    }

    if (this.context.link) {
      const container = this.creep.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER) as StructureContainer

      if (container && container.store.getUsedCapacity(RESOURCE_ENERGY) && this.creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
        this.creep.withdraw(container, RESOURCE_ENERGY)
      }
    }

    return this.waitNextTick()
  }

  private maintainLink() {
    const link: StructureLink | ConstructionSite | null = Game.getObjectById(this.context.link) || this.findStructure<StructureLink>(this.context.linkPos, STRUCTURE_LINK)

    // try to create or find an existing container
    if (link == null) {
      return null
    }

    this.context.link = link.id

    // try to build link every 13 tick
    if (Game.time % 13 === 0 && link instanceof ConstructionSite && this.canBuildStructures()) {
      try { this.creep.cancelOrder('harvest') } catch {}
      this.creep.build(link)
    }

    if (link instanceof StructureLink) {
      if (!this.creep.pos.isNearTo(link)) {
        this.creep.travelTo(link, { range: 1, ignoreCreeps: false })
      } else if (link.store.getFreeCapacity(RESOURCE_ENERGY) && this.creep.store.getFreeCapacity() as number < this.creep.getActiveBodyparts(WORK) * 2) {
        this.creep.transfer(link, RESOURCE_ENERGY)
      }
    }

    return null
  }

  private maintainContainer() {
    const container: StructureContainer | ConstructionSite | null = Game.getObjectById(this.context.container) || this.findStructure<StructureContainer>(this.context.containerPos, STRUCTURE_CONTAINER)

    // try to create or find an existing container
    if (container == null) {
      const { x, y } = this.context.containerPos

      this.creep.room.createConstructionSite(x, y, STRUCTURE_CONTAINER)

      return this.waitNextTick()
    }

    this.context.container = container.id

    // try to build container every 11th tick
    if (Game.time % 11 === 0 && container instanceof ConstructionSite && this.canBuildStructures()) {
      try { this.creep.cancelOrder('harvest') } catch {}
      this.creep.build(container)
    }

    // try to move on top of container every 10 ticks
    if (!this.creep.pos.isEqualTo(container) && !container.pos.lookFor(LOOK_CREEPS).length) {
      this.creep.travelTo(container, { ignoreCreeps: true })

      return this.waitNextTick()
    }

    // repair container every 95 ticks
    if (Game.time % 43 === 0 && container instanceof StructureContainer && container.hits < container.hitsMax - 5000 && this.canBuildStructures()) {
      try { this.creep.cancelOrder('harvest') } catch {}
      this.creep.repair(container)
    }

    // if not on top of container, try to transfer to it
    if (container instanceof StructureContainer && !this.creep.pos.isEqualTo(container) && this.creep.pos.isNearTo(container) && container.store.getFreeCapacity(RESOURCE_ENERGY) as number && this.creep.store.getFreeCapacity() as number < this.creep.getActiveBodyparts(WORK) * 2) {
      this.creep.transfer(container, RESOURCE_ENERGY)
    }

    return null
  }

  private canBuildStructures() {
    return this.creep.getActiveBodyparts(WORK) && this.creep.getActiveBodyparts(CARRY) && this.creep.store.getUsedCapacity(RESOURCE_ENERGY)
  }

  private findStructure<T>(hasPos: { x: number, y: number }, structureType: BuildableStructureConstant): T | ConstructionSite | null {

    const pos = this.creep.room.getPositionAt(hasPos.x, hasPos.y) as RoomPosition

    const structure = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === structureType) as any

    if (structure) {
      return structure
    }

    const constructionSite = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(c => c.structureType === structureType)

    if (constructionSite) {
      return constructionSite
    }

    return null
  }
}
