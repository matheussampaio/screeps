import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'
import { ICreepContext } from './interfaces'

@ActionsRegistry.register
export class CreepHaulerMineral extends Action {
  protected context: any

  run(context: ICreepContext) {
    this.context = context

    if (this.storage == null) {
      return this.sleep(5)
    }

    if (!this.creep.store.getUsedCapacity()) {
      return this.unshiftAndContinue(CreepHaulerGetMineral.name)
    }

    // if storage is full, wait
    if (!this.storage.store.getFreeCapacity()) {
      return this.waitNextTick()
    }

    // move to storage
    if (!this.creep.pos.isNearTo(this.storage)) {
      this.creep.travelTo(this.storage, { range: 1 })
      return this.waitNextTick()
    }

    // start transfering to storage
    for (const resource in this.creep.store) {
      this.creep.transfer(this.storage, resource as ResourceConstant)

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
}

@ActionsRegistry.register
export class CreepHaulerGetMineral extends CreepHaulerMineral {
  run(context: ICreepContext): any {
    this.context = context

    if (!this.creep.store.getFreeCapacity()) {
      return this.shiftAndContinue()
    }

    let result = this.pickUpMineral()

    if (result) {
      return result
    }

    return this.withdrawContainers()
  }

  pickUpMineral(): [ACTIONS_RESULT, ...(string | number)[]] | null {
    const mineral: Source | null = Game.getObjectById(this.context.mineral)

    if (mineral == null) {
      return this.shiftAndStop()
    }

    const resources: Resource[] = mineral.pos.findInRange(FIND_DROPPED_RESOURCES, 2, {
      filter: r => r.amount > 50
    })

    resources.sort((r1, r2) => r2.amount - r1.amount)

    const resource = _.head(resources)

    if (resource == null) {
      return null
    }

    if (this.creep.pos.isNearTo(resource)) {
      this.creep.pickup(resource)
    } else {
      this.creep.travelTo(resource, { range: 1 })
    }

    return this.waitNextTick()
  }

  withdrawContainers(): [ACTIONS_RESULT, ...(string | number)[]] {
    const container = this.getContainer()

    if (container == null) {
      return this.waitNextTick()
    }

    if (!this.creep.pos.isNearTo(container)) {
      this.creep.travelTo(container, { range: 1 })
      return this.waitNextTick()
    }

    const containerUsedCapacity = container.store.getUsedCapacity() as number
    const containerFreeCapacity = container.store.getFreeCapacity() as number

    const creepFreeCapacity = this.creep.store.getFreeCapacity() as number

    if (containerFreeCapacity && containerUsedCapacity < creepFreeCapacity) {
      return this.waitNextTick()
    }

    for (const resource in container.store) {
      this.creep.withdraw(container, resource as MineralConstant)

      return this.waitNextTick()
    }

    return this.waitNextTick()
  }

  getContainer(): StructureContainer | null {
    let container: StructureContainer | null = Game.getObjectById(this.context.container)

    if (container != null) {
      return container
    }

    const { x, y } = this.context.containerPos

    const pos = this.room.getPositionAt(x, y) as RoomPosition

    container = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER) as StructureContainer

    if (container) {
      this.context.container = container.id
    }

    return container
  }
}
