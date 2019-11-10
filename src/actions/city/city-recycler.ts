import * as _ from 'lodash'

import { ActionsRegistry, PRIORITY } from '../../core'
import { CreateBody } from '../../utils/create-body'
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
      return this.sleep(creep.ticksToLive)
    }

    const tombstoneWithResource = this.room.find(FIND_TOMBSTONES).some(t => t.store.getUsedCapacity() >= 100)

    if (tombstoneWithResource) {
      this.createRecyclerCreep()
    }

    return this.sleep(50)
  }

  private createRecyclerCreep() {
    const body: BodyPartConstant[] = new CreateBody({ minimumEnergy: 300, energyAvailable: this.room.energyAvailable, ticksToMove: 3, maxParts: { [CARRY]: 10 } })
        .add([CARRY], { repeat: true })
        .value()

    const creepName = utils.getUniqueCreepName('recycler')

    this.queue.push({
      body,
      creepName,
      actions: [[CreepCheckStop.name], [CreepRecycler.name]],
      priority: PRIORITY.VERY_LOW,
      memory: {}
    })

    this.context.recyclerCreep = creepName
  }
}

