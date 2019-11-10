import * as _ from 'lodash'

import { ActionsRegistry, PRIORITY } from '../../core'
import { CreateBody } from '../../utils/create-body'
import { CreepCheckStop, CreepGeneric } from '../creep'
import { ICityContext, IPlanSource } from './interfaces'
import { City } from './city'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CityEmergency extends City {
  run(context: ICityContext) {
    this.context = context

    const creep = Game.creeps[this.emergencyCreep]

    // already in emergency
    if (creep) {
      console.log('emergency', creep.ticksToLive)
      return this.waitNextTick()
    }

    let enableEmergencyCreep = true

    for (const source of this.sources) {
      const foundOneHarvesterAlive = source.harvesters.some(creepName => Game.creeps[creepName])
      const foundOneHaulerAlive = source.haulers.some(creepName => Game.creeps[creepName])

      if (foundOneHarvesterAlive && foundOneHaulerAlive) {
        enableEmergencyCreep = false
        break
      }

      // if (source.linkPos) {
      //   const pos = this.room.getPositionAt(source.linkPos.x, source.linkPos.y) as RoomPosition

      //   const link = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_LINK) as StructureLink

      //   if (foundOneHarvesterAlive && link) {
      //     enableEmergencyCreep = false
      //     break
      //   }
      // }
    }

    if (enableEmergencyCreep && this.room.energyAvailable >= 300) {
      this.createEmergencyCreep(context)
    }

    return this.sleep(100)
  }

  private createEmergencyCreep(context: ICityContext) {
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

    context.emergencyCreep = creepName
  }
}

