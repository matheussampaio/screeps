import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { ICityContext } from './interfaces'
import * as utils from '../../utils'
import { City } from './city'

@ActionsRegistry.register
export class CityDefense extends City {
  run(context: ICityContext) {
    this.context = context

    if (Memory.enemies == null) {
      Memory.enemies = {}
    }

    for (const roomName in Memory.enemies) {
      if (Memory.enemies[roomName] as number <= Game.time - 1500) {
        delete Memory.enemies[roomName]
      }
    }

    const enemies: Creep[] = this.room.find(FIND_HOSTILE_CREEPS) as Creep[]

    const towers: StructureTower[] = this.room.find(FIND_MY_STRUCTURES, {
      filter: t => t.structureType === STRUCTURE_TOWER && t.store.getUsedCapacity(RESOURCE_ENERGY) as number >= 10
    }) as StructureTower[]

    if (enemies.length) {
      Memory.enemies[this.room.name] = enemies.length ? Game.time : undefined
    } else {
      delete Memory.enemies[this.room.name]
    }

    if (enemies.length && !towers.length) {
      return this.enableSafeMode()
    }

    if (enemies.length && towers.length) {
      return this.attack(towers, enemies)
    }

    const babyStructures = this.room.find(FIND_STRUCTURES, {
      filter: s => (s.structureType === STRUCTURE_RAMPART && s.hits <= RAMPART_DECAY_AMOUNT) || (s.structureType === STRUCTURE_ROAD && s.hits <= ROAD_DECAY_AMOUNT)
    }) as (StructureRampart | StructureRoad)[]

    if (babyStructures.length) {
      return this.repair(towers, babyStructures)
    }

    const towersWithEnoughEnergyForRepair = towers.filter(t => t.store.getUsedCapacity(RESOURCE_ENERGY) as number >= 500)

    if (!towersWithEnoughEnergyForRepair.length) {
      return this.waitNextTick()
    }

    if (this.storage && this.storage.store.getUsedCapacity(RESOURCE_ENERGY) as number <= 5000) {
      return this.waitNextTick()
    }

    const wallsHP: { [level: number]: number } = {
      1: 5000,
      2: 5000,
      3: 5000,
      4: 5000,
      5: 5000,
      6: 25000,
      7: 75000,
      8: 200000
    }

    const roads = this.room.find(FIND_STRUCTURES, {
      filter: r => r.structureType === STRUCTURE_ROAD && r.hitsMax - r.hits >= 800
    }) as StructureRoad[]

    if (roads.length) {
      return this.repair(towersWithEnoughEnergyForRepair, roads)
    }

    const controller = this.room.controller as StructureController

    const walls = this.room.find(FIND_STRUCTURES, {
      filter: r => (r.structureType === STRUCTURE_WALL || r.structureType === STRUCTURE_RAMPART) && r.hits < wallsHP[controller.level]
    }) as (StructureWall | StructureRampart)[]

    if (walls.length) {
      return this.repair(towersWithEnoughEnergyForRepair, walls)
    }

    return this.waitNextTick()
  }

  repair(towers: StructureTower[], structures: (StructureWall | StructureRoad | StructureRampart)[]) {
    structures.sort((a: any, b: any) => a.hits - b.hits)

    while(towers.length && structures.length) {
      const structure = structures.shift() as StructureRoad | StructureWall | StructureRampart
      const tower = towers.shift() as StructureTower

      tower.repair(structure)
    }

    return this.waitNextTick()
  }

  enableSafeMode() {
    // safe mode already enabled
    if (this.controller.safeMode) {
      return this.waitNextTick()
    }

    // safe mode in cooldown, we need to wait
    if (this.controller.safeModeCooldown) {
      return this.waitNextTick()
    }

    // controller blocked, we cant use safe mode while this active
    if (this.controller.upgradeBlocked) {
      return this.waitNextTick()
    }

    // no safe mode available
    if (!this.controller.safeModeAvailable) {
      return this.waitNextTick()
    }

    // enable safe mode
    this.controller.activateSafeMode()

    return this.waitNextTick()
  }

  attack(towers: StructureTower[], enemies: Creep[]) {
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
