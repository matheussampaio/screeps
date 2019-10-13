import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { ICityContext } from './interfaces'

export class CityDefense extends Action {
  run(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    const room: Room = Game.rooms[context.roomName]

    const enemies = room.find(FIND_HOSTILE_CREEPS)

    if (!enemies.length) {
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    const towers: StructureTower[] = room.find(FIND_MY_STRUCTURES, {
      filter: t => t.structureType === STRUCTURE_TOWER && t.energy >= 10
    }) as StructureTower[]

    if (towers.length) {
      const enemy = enemies.sort((e1, e2) => e1.hits - e2.hits)[0]

      towers.forEach((tower) => {
        tower.attack(enemy)
      })

      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (room.controller && room.controller.safeMode) {
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (room.controller && room.controller.safeModeAvailable) {
      room.controller.activateSafeMode()
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }
}
