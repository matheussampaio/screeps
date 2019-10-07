import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../core'
import { CreepAction } from './creep'

interface CityContext {
  roomName: string
}

export class City extends Action {
  run(context: CityContext): [ACTIONS_RESULT, ...string[]] {
    // @TODO: spawn creeps whenever something is ready
    // sort the spawn creeps by priority

    const room = Game.rooms[context.roomName]

    if (room.energyAvailable >= 150 && _.keys(Game.creeps).length < 10) {
      const spawn: StructureSpawn = Game.spawns.Spawn1

      const creepName: string = this.getUniqueName()

      const result: ScreepsReturnCode = spawn.spawnCreep([MOVE, CARRY, WORK], creepName)

      this.logger.debug(`result=${result}`)

      // TODO: se createCreep retorna success
      if (result === OK) {
        this.fork({
          actions: [[CreepAction.name]],
          memory: { creepName }
        })
      }
    }

    // @TODO: spawn courier and harverster
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
