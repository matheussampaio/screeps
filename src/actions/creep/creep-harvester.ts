import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'

@ActionsRegistry.register
export class CreepHarvester extends Action {
  run(context: any): [ACTIONS_RESULT, ...string[]] {
    const source: Source | null = Game.getObjectById(context.source)

    // if source doesn't exist, something is really wrong. :(
    if (source == null) {
      this.logger.error(`CreepHarvester:${context.creepName}: source does not exists`)

      return this.halt()
    }

    const creep = Game.creeps[context.creepName]

    // walk to source
    if (!creep.pos.isNearTo(source)) {
      creep.moveTo(source)
      return this.waitNextTick()
    }

    // harvest the source
    if (source.energy) {
      context.working = creep.harvest(source) === OK
    }

    const container: StructureContainer | ConstructionSite | null = Game.getObjectById(context.container)

    // try to create or find an existing container
    if (container == null) {
      this.findOrCreateContainer(context, creep)
      return this.waitNextTick()
    }

    // try to build container every 3rd tick
    if (Game.time % 11 === 0 && container instanceof ConstructionSite && this.canBuildContainer(context, creep)) {
      creep.cancelOrder('harvest')
      creep.build(container)
    }

    // try to move on top of container every 10 ticks
    if (Game.time % 12 === 0 && !creep.pos.isEqualTo(container) && !container.pos.lookFor(LOOK_CREEPS).length) {
      creep.moveTo(container)
    }

    // repair container eveery 95 ticks
    if (Game.time % 43 === 0 && container instanceof StructureContainer && container.hits < container.hitsMax - 5000 && this.canBuildContainer(context, creep)) {
      creep.cancelOrder('harvest')
      creep.repair(container)
    }

    // if not on top of container, try to transfer to it
    if (container instanceof StructureContainer && !creep.pos.isEqualTo(container) && creep.pos.isNearTo(container) && container.store.getFreeCapacity(RESOURCE_ENERGY) as number && creep.store.getFreeCapacity() as number < creep.getActiveBodyparts(WORK) * 2) {
      creep.transfer(container, RESOURCE_ENERGY)
    }

    return this.waitNextTick()
  }

  canBuildContainer(context: any, creep: Creep) {
    return context.working && creep.getActiveBodyparts(WORK) && creep.getActiveBodyparts(CARRY) && creep.store.getUsedCapacity(RESOURCE_ENERGY)
  }

  findOrCreateContainer(context: any, creep: Creep) {
    const { x, y } = context.containerPos

    const pos = creep.room.getPositionAt(x, y) as RoomPosition

    const container = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER)

    if (container) {
      context.container = container.id

      return
    }

    const constructionSite = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(c => c.structureType === STRUCTURE_CONTAINER)

    if (constructionSite) {
      context.container = constructionSite.id

      return
    }

    creep.room.createConstructionSite(x, y, STRUCTURE_CONTAINER)
  }
}
