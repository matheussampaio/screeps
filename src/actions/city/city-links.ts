import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { ICityContext } from './interfaces'
import * as utils from '../../utils'
import { City } from './city'
import { CreepCheckStop, CreepRenew, CreepLink } from '../creep'
import { CreateBody, CREEP_PRIORITY } from '../../utils'

@ActionsRegistry.register
export class CityLinks extends City {
  run(context: ICityContext) {
    this.context = context

    if (!CONTROLLER_STRUCTURES[STRUCTURE_LINK][this.controller.level]) {
      return this.sleep(1000)
    }

    if (this.storage == null) {
      return this.sleep(100)
    }

    const storageLink = this.getStorageLink()

    if (storageLink == null) {
      return this.sleep(500)
    }

    if (this.context.linkCreep == null) {
      this.createLinkCreep(storageLink.id as string)
      return this.sleep(5)
    }

    const creep = Game.creeps[this.context.linkCreep as string]

    if (creep == null) {
      if (this.isCreepNameInQueue(this.context.linkCreep)) {
        return this.sleep(5)
      }

      this.createLinkCreep(storageLink.id as string)
      return this.sleep(5)
    }

    if (creep.spawning) {
      return this.sleep(5)
    }

    if (storageLink.store.getFreeCapacity(RESOURCE_ENERGY) as number <= 10) {
      return this.waitNextTick()
    }

    const fullSourceLink = this.getFullSourceLink()

    if (fullSourceLink == null) {
      return this.waitNextTick()
    }

    fullSourceLink.transferEnergy(storageLink)

    return this.waitNextTick()
  }

  private createLinkCreep(storageLinkId: string) {
    const creepName = utils.getUniqueCreepName('link')

    const memory = {
      link: storageLinkId,
      energy: this.room.energyCapacityAvailable
    }

    const maxParts = {
      [MOVE]: 1,
      [CARRY]: 16
    }

    this.queue.push({
      memory,
      creepName,
      body: new CreateBody({
        maxParts,
        minimumEnergy: this.room.energyCapacityAvailable,
        ticksToMove: 4
      })
      .add([CARRY], { repeat: true })
      .value(),
      actions: [[CreepCheckStop.name], [CreepLink.name], [CreepRenew.name]],
      priority: CREEP_PRIORITY.LINKER
    })

    this.context.linkCreep = creepName

    return creepName
  }

  private getLink(hasPos: { x: number, y: number } | undefined | null): StructureLink | null {
    if (hasPos == null) {
      return null
    }

    const pos = this.room.getPositionAt(hasPos.x, hasPos.y)

    if (pos == null) {
      return null
    }

    const link = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_LINK) as StructureLink

    return link
  }

  private getStorageLink(): StructureLink | null {
    return this.getLink(this.planner.storageLinkPos)
  }

  private getFullSourceLink(): StructureLink | null {
    const positions = [
      ...this.sources.map(s => s.linkPos)
    ]

    for (const pos of positions) {
      const link = this.getLink(pos)

      if (link && !link.cooldown && !link.store.getFreeCapacity(RESOURCE_ENERGY)) {
        return link
      }
    }

    return null
  }
}
