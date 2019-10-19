import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { ICityContext } from './interfaces'
import * as utils from '../../utils'

export class CityDefense extends Action {
  run(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    const room: Room = Game.rooms[context.roomName]

    const enemies: Creep[] = room.find(FIND_HOSTILE_CREEPS) as Creep[]

    if (!enemies.length) {
      return this.waitNextTick()
    }

    const towers: StructureTower[] = room.find(FIND_MY_STRUCTURES, {
      filter: t => t.structureType === STRUCTURE_TOWER && t.store.getCapacity(RESOURCE_ENERGY) as number >= 10
    }) as StructureTower[]


    if (towers.length) {
      enemies.sort((e1: Creep, e2: Creep) => {
        const enemy1AttackParts = utils.getActiveBodyPartsFromCreep(e1, ATTACK)
        const enemy2AttackParts = utils.getActiveBodyPartsFromCreep(e2, ATTACK)

        return enemy2AttackParts - enemy1AttackParts
      })

      const enemy = enemies[0]

      towers.forEach((tower) => {
        tower.attack(enemy)
      })

      return this.waitNextTick()
    }

    if (room.controller && room.controller.safeMode) {
      return this.waitNextTick()
    }

    if (room.controller && room.controller.safeModeAvailable) {
      room.controller.activateSafeMode()
      return this.waitNextTick()
    }

    return this.waitNextTick()
  }
}
