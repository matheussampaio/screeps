import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'
import { ICityContext } from './interfaces'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CityDefense extends Action {
  run(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    const room: Room = Game.rooms[context.roomName]

    const enemies: Creep[] = room.find(FIND_HOSTILE_CREEPS) as Creep[]

    const towers: StructureTower[] = room.find(FIND_MY_STRUCTURES, {
      filter: t => t.structureType === STRUCTURE_TOWER && t.store.getCapacity(RESOURCE_ENERGY) as number >= 10
    }) as StructureTower[]

    if (enemies.length && !towers.length) {
      return this.enableSafeMode(context)
    }

    if (enemies.length && towers.length) {
      return this.attack(towers, enemies)
    }

    const roads = room.find(FIND_STRUCTURES, {
      filter: r => r.structureType === STRUCTURE_ROAD && r.hitsMax - r.hits >= 800
    }) as StructureRoad[]

    if (roads.length) {
      return this.repair(towers, roads)
    }

    const wallsHP: { [level: number]: number } = {
      1: 250,
      2: 500,
      3: 750,
      4: 1000,
      5: 5000,
      6: 25000,
      7: 75000,
      8: 200000
    }

    const controller = room.controller as StructureController

    const walls = room.find(FIND_STRUCTURES, {
      filter: r => r.structureType === STRUCTURE_WALL && r.hits < wallsHP[controller.level]
    }) as StructureWall[]

    if (walls.length) {
      return this.repair(towers, walls)
    }

    const ramparts = room.find(FIND_STRUCTURES, {
      filter: r => r.structureType === STRUCTURE_RAMPART && r.hits < wallsHP[controller.level]
    }) as StructureRampart[]

    if (ramparts.length) {
      return this.repair(towers, ramparts)
    }

    return this.waitNextTick()
  }

  repair(towers: StructureTower[], structures: StructureRoad[] | StructureWall[] | StructureRampart[]): [ACTIONS_RESULT.WAIT_NEXT_TICK] {

    for (const tower of towers) {
      const s = _.sample(structures) as StructureRoad | StructureWall | StructureRampart

      tower.repair(s)
    }

    return this.waitNextTick()
  }

  enableSafeMode(context: ICityContext): [ACTIONS_RESULT.WAIT_NEXT_TICK] {
    const room: Room = Game.rooms[context.roomName]

    if (room.controller && room.controller.safeMode) {
      return this.waitNextTick()
    }

    if (room.controller && room.controller.safeModeAvailable) {
      room.controller.activateSafeMode()
      return this.waitNextTick()
    }

    return this.waitNextTick()
  }

  attack(towers: StructureTower[], enemies: Creep[]): [ACTIONS_RESULT.WAIT_NEXT_TICK] {
    enemies.sort((e1: Creep, e2: Creep) => {
      const enemy1AttackParts = utils.getActiveBodyPartsFromCreep(e1, ATTACK)
      const enemy2AttackParts = utils.getActiveBodyPartsFromCreep(e2, ATTACK)

      return enemy2AttackParts - enemy1AttackParts
    })

    const enemy = enemies[0]

    for (const tower of towers) {
      tower.attack(enemy)
    }

    return this.waitNextTick()
  }
}
