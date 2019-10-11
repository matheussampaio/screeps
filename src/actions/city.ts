import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../core'
import { CreepGeneric } from './creep'
import { CreateBody } from '../utils/create-body'

interface CityContext {
  roomName: string
}

export class City extends Action {
  run(context: CityContext): [ACTIONS_RESULT, ...string[]] {
    // @TODO: spawn creeps whenever something is ready
    // sort the spawn creeps by priority

    const room = Game.rooms[context.roomName]

    // @TODO count how many creeps this room owns, instead of the whole Game.creeps
    const isEmergency = _.values(Game.creeps).length === 0
    const minimumEnergy = isEmergency ? SPAWN_ENERGY_CAPACITY : room.energyCapacityAvailable

    if (room.energyAvailable >= minimumEnergy && _.keys(Game.creeps).length < 10) {
      const spawns: StructureSpawn[] | null = room.find(FIND_MY_SPAWNS, {
        filter: (spawn: StructureSpawn) => !spawn.spawning
      })

      if (spawns == null || !spawns.length) {
        return [ACTIONS_RESULT.WAIT_NEXT_TICK]
      }

      const spawn: StructureSpawn = spawns[0]

      const creepName: string = this.getUniqueName()

      const body = new CreateBody({ minimumEnergy, energy: room.energyAvailable })
        .addWithMove([WORK, CARRY])

      const result: ScreepsReturnCode = spawn.spawnCreep(body.value(), creepName)

      this.logger.debug(`result=${result}`)

      if (result === OK) {
        this.fork({
          actions: [[CreepGeneric.name]],
          memory: { creepName }
        })
      }
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  getUniqueName(): string {
    let counter = 0

    while (Game.creeps[`creep-${counter}`]) {
      counter++
    }

    return `creep-${counter}`
  }
}
