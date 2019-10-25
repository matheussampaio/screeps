import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT, PRIORITY } from '../../core'
import { CreateBody } from '../../utils/create-body'
import { CreepCheckStop, CreepGeneric } from '../creep'
import { ICityContext, IPlanSource } from './interfaces'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CityEmergency extends Action {
  run(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    const creep = Game.creeps[context.emergencyCreep]

    // already in emergency
    if (creep) {
      return this.waitNextTick()
    }

    let hasHarvesters = false
    let hasHaulers = false

    const sources: IPlanSource[] = _.get(context, 'plan.sources', [])

    for (const source of sources) {
      const foundOneHarvesterAlive = source.harvesters.some(creepName => Game.creeps[creepName])
      const foundOneHaulerAlive = source.haulers.some(creepName => Game.creeps[creepName])

      if (foundOneHarvesterAlive) {
        hasHarvesters = true
      }

      if (foundOneHaulerAlive) {
        hasHaulers = true
      }
    }

    const enableEmergencyCreep = !hasHaulers || !hasHarvesters

    if (enableEmergencyCreep) {
      context.queue = []

      this.createEmergencyCreep(context)
    }

    return this.waitNextTick()
  }

  private createEmergencyCreep(context: ICityContext) {
    const room: Room = Game.rooms[context.roomName]
    const body: BodyPartConstant[] = new CreateBody({ minimumEnergy: 300, energyAvailable: room.energyAvailable })
        .add([WORK, CARRY], { repeat: true, withMove: true })
        .value()
    const creepName = utils.getUniqueCreepName('emergency')

    context.queue.push({
      body,
      creepName,
      actions: [[CreepCheckStop.name], [CreepGeneric.name]],
      priority: PRIORITY.VERY_HIGH,
      memory: {}
    })

    context.emergencyCreep = creepName
  }
}

