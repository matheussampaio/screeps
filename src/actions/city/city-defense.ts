import * as _ from 'lodash'

import { ActionsRegistry, ACTIONS_RESULT } from '../../core'
import { ICityContext } from './interfaces'
import * as utils from '../../utils'
import { City } from './city'

@ActionsRegistry.register
export class CityDefense extends City {
  run(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    this.context = context

    const enemies: Creep[] = this.room.find(FIND_HOSTILE_CREEPS) as Creep[]

    const towers: StructureTower[] = this.room.find(FIND_MY_STRUCTURES, {
      filter: t => t.structureType === STRUCTURE_TOWER && t.store.getCapacity(RESOURCE_ENERGY) as number >= 10
    }) as StructureTower[]

    if (enemies.length && !towers.length) {
      return this.enableSafeMode()
    }

    if (enemies.length && towers.length) {
      return this.attack(towers, enemies)
    }

    if (this.storage && this.storage.store.getUsedCapacity(RESOURCE_ENERGY) as number <= 10000) {
      return this.waitNextTick()
    }

    const roads = this.room.find(FIND_STRUCTURES, {
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

    const controller = this.room.controller as StructureController

    const walls = this.room.find(FIND_STRUCTURES, {
      filter: r => r.structureType === STRUCTURE_WALL && r.hits < wallsHP[controller.level]
    }) as StructureWall[]

    if (walls.length) {
      return this.repair(towers, walls)
    }

    const ramparts = this.room.find(FIND_STRUCTURES, {
      filter: r => r.structureType === STRUCTURE_RAMPART && r.hits < wallsHP[controller.level]
    }) as StructureRampart[]

    if (ramparts.length) {
      return this.repair(towers, ramparts)
    }

    return this.waitNextTick()
  }

  repair(towers: StructureTower[], structures: StructureRoad[] | StructureWall[] | StructureRampart[]): [ACTIONS_RESULT.WAIT_NEXT_TICK] {
    while(towers.length && structures.length) {
      const structure = structures.shift() as StructureRoad | StructureWall | StructureRampart
      const tower = towers.shift() as StructureTower

      tower.repair(structure)
    }

    return this.waitNextTick()
  }

  enableSafeMode(): [ACTIONS_RESULT.WAIT_NEXT_TICK] {
    if (this.controller.safeMode) {
      return this.waitNextTick()
    }

    if (this.controller.safeModeAvailable) {
      this.controller.activateSafeMode()

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
