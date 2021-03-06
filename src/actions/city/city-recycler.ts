import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { CreateBody, CREEP_PRIORITY } from '../../utils'
import { CreepCheckStop, CreepRecycler } from '../creep'
import { ICityContext } from './interfaces'
import { City } from './city'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CityRecycler extends City {
  run(context: ICityContext) {
    this.context = context

    if (!this.controller.my) {
      return this.sleep(50)
    }

    if (this.storage == null) {
      return this.sleep(500)
    }

    const creep = Game.creeps[this.context.recyclerCreep as string]

    if (creep) {
      return this.sleep(50)
    }

    if (this.isCreepNameInQueue(this.context.recyclerCreep as string)) {
      return this.sleep(50)
    }

    const tombstoneWithResource = this.room.find(FIND_TOMBSTONES, {
      filter: t => {
        if (t.store.getUsedCapacity(RESOURCE_ENERGY) >= 300) {
          return true
        }

        return t.store.getUsedCapacity() - t.store.getUsedCapacity(RESOURCE_ENERGY)
      }
    })

    if (tombstoneWithResource.length) {
      this.createRecyclerCreep()

      return this.sleep(50)
    }

    const ruinsWithResource = this.room.find(FIND_RUINS, {
      filter: r => r.store.getUsedCapacity()
    })

    if (ruinsWithResource.length) {
      this.createRecyclerCreep()

      return this.sleep(50)
    }

    const resources = this.room.find(FIND_DROPPED_RESOURCES, {
      filter: r => (r.resourceType === RESOURCE_ENERGY && r.amount >= 300) || (r.resourceType !== RESOURCE_ENERGY && r.amount >= 100)
    })

    if (resources.length) {
      this.createRecyclerCreep()

      return this.sleep(50)
    }

    return this.sleep(50)
  }

  private createRecyclerCreep() {
    const body: BodyPartConstant[] = new CreateBody({ minimumEnergy: 300, energyAvailable: this.room.energyAvailable, ticksToMove: 2, maxParts: { [CARRY]: 10 } })
        .add([CARRY], { repeat: true })
        .value()

    const creepName = utils.getUniqueCreepName('recycler')

    this.queue.push({
      body,
      creepName,
      actions: [[CreepCheckStop.name], [CreepRecycler.name]],
      priority: CREEP_PRIORITY.RECYCLER,
      memory: {}
    })

    this.context.recyclerCreep = creepName
  }
}

