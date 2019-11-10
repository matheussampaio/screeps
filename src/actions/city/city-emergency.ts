import * as _ from 'lodash'

import { ActionsRegistry, PRIORITY } from '../../core'
import { CreateBody } from '../../utils/create-body'
import { CreepCheckStop, CreepGeneric } from '../creep'
import { ICityContext } from './interfaces'
import { City } from './city'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CityEmergency extends City {
  run(context: ICityContext) {
    this.context = context

    if (!this.controller.my) {
      return this.sleep(50)
    }

    if (Game.creeps[this.context.emergencyCreep as string]) {
      return this.sleep(50)
    }

    const foundCreepInTheRoom = Object.values(Game.creeps).find(creep => (
      creep.my && creep.memory.roomName === this.room.name
    ))

    if (!foundCreepInTheRoom) {
      return this.emergency()
    }

    const foundHarvester = this.sources.some(
      source => source.harvesters.some(creepName => Game.creeps[creepName])
    )

    if (!foundHarvester) {
      return this.emergency()
    }

    return this.waitNextTick()
  }

  private emergency() {
    this.context.queue = []

    this.createEmergencyCreep()

    return this.sleep(350)
  }

  private createEmergencyCreep() {
    const body: BodyPartConstant[] = new CreateBody({ minimumEnergy: 300, energyAvailable: this.room.energyAvailable })
        .add([WORK, CARRY], { repeat: true, withMove: true })
        .value()
    const creepName = utils.getUniqueCreepName('emergency')

    this.queue.push({
      body,
      creepName,
      actions: [[CreepCheckStop.name], [CreepGeneric.name]],
      priority: PRIORITY.VERY_HIGH,
      memory: {}
    })

    this.context.emergencyCreep = creepName
  }
}

