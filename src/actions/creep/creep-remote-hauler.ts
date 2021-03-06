import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { ICreepContext } from './interfaces'
import { CreepAction } from './creep-action'

@ActionsRegistry.register
export class CreepRemoteHauler extends CreepAction {
  run(context: ICreepContext) {
    this.context = context

    if (!this.storage) {
      return this.waitNextTick()
    }

    if (!this.creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
      return this.unshiftAndContinue(CreepRemoteHaulerGetEnergy.name)
    }

    if (!this.creep.pos.isNearTo(this.storage)) {
      this.creep.travelTo(this.storage, { range: 1, ignoreCreeps: this.creep.room.name === this.room.name })

      return this.waitNextTick()
    }

    this.creep.transfer(this.storage, RESOURCE_ENERGY)

    return this.waitNextTick()
  }
}

@ActionsRegistry.register
export class CreepRemoteHaulerMaintainRoad extends CreepAction {
  run(context: ICreepContext) {
    this.context = context

    if (!this.creep.store.getUsedCapacity(RESOURCE_ENERGY) || !this.creep.getActiveBodyparts(WORK)) {
      return this.waitNextTick()
    }

    if (this.creep.room.name === this.room.name) {
      return this.waitNextTick()
    }

    const roadConstruction = this.creep.room.find(FIND_CONSTRUCTION_SITES, {
      filter: s => s.my && s.structureType === STRUCTURE_ROAD
    })
    .sort((r1, r2) => this.creep.pos.getRangeTo(r1) - this.creep.pos.getRangeTo(r2))

    if (roadConstruction.length) {
      const road = roadConstruction[0]

      if (this.creep.pos.inRangeTo(road, 3)) {
        this.creep.build(roadConstruction[0])
      } else {
        this.creep.travelTo(road, { range: 3, ignoreCreeps: this.creep.room.name === this.room.name })
      }

      return this.waitNextTickAll()
    }

    const road = this.creep.pos.lookFor(LOOK_STRUCTURES)
      .find(s => s.structureType === STRUCTURE_ROAD && s.hits < s.hitsMax)

    if (road) {
      this.creep.repair(road)
    }

    return this.waitNextTick()
  }
}

@ActionsRegistry.register
export class CreepRemoteHaulerGetEnergy extends CreepRemoteHauler {
  run(context: any) {
    this.context = context

    if (!this.creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      return this.shiftAndContinue()
    }

    if (this.context.remoteRoom !== this.creep.room.name) {
      const pos = new RoomPosition(25, 25, this.context.remoteRoom)

      this.creep.travelTo(pos, { range: 22, ignoreCreeps: this.creep.room.name === this.room.name })

      return this.waitNextTick()
    }

    const source: Source | null = Game.getObjectById(this.context.source as string)

    if (source && !this.creep.pos.inRangeTo(source, 2)) {
      this.creep.travelTo(source, { range: 2, ignoreCreeps: this.creep.room.name === this.room.name })

      return this.waitNextTick()
    }

    let result = this.pickUpEnergy()

    if (result) {
      return result
    }

    return this.withdrawContainers()
  }

  pickUpEnergy() {
    const source: Source | null = Game.getObjectById(this.context.source as string)

    if (source == null) {
      return this.shiftAndStop()
    }

    const resources: Resource[] = source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
      filter: r => r.resourceType === RESOURCE_ENERGY && r.amount > 50
    })

    resources.sort((r1, r2) => r2.amount - r1.amount)

    const resource = _.head(resources)

    if (resource == null) {
      return null
    }

    if (this.creep.pos.isNearTo(resource)) {
      this.creep.pickup(resource)
    } else {
      this.creep.travelTo(resource, { range: 1, ignoreCreeps: this.creep.room.name === this.room.name })
    }

    return this.waitNextTick()
  }

  withdrawContainers() {
    const container = this.getContainer()

    if (container == null) {
      return this.waitNextTick()
    }

    if (!this.creep.pos.isNearTo(container)) {
      this.creep.travelTo(container, { range: 1 , ignoreCreeps: this.creep.room.name === this.room.name })
      return this.waitNextTick()
    }

    const containerUsedCapacity = container.store.getUsedCapacity(RESOURCE_ENERGY) as number
    const containerFreeCapacity = container.store.getFreeCapacity(RESOURCE_ENERGY) as number
    const creepFreeCapacity = this.creep.store.getFreeCapacity(RESOURCE_ENERGY) as number

    if (containerFreeCapacity && containerUsedCapacity < creepFreeCapacity) {
      return this.waitNextTick()
    }

    this.creep.withdraw(container, RESOURCE_ENERGY)

    return this.waitNextTick()
  }

  getContainer(): StructureContainer | null {
    let container: StructureContainer | null = Game.getObjectById(this.context.container)

    if (container != null) {
      return container
    }

    const { x, y, roomName } = this.context.containerPos

    const pos = new RoomPosition(x, y, roomName)

    container = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER) as StructureContainer

    if (container) {
      this.context.container = container.id
    }

    return container
  }
}


