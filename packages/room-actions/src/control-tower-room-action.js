import { Action, ActionRegistry } from '@sae/core'

@ActionRegistry.register
export class ControlTowerRoomAction extends Action {
  run(room) {
    const towers = room.find(FIND_STRUCTURES, {
      filter: t => t.structureType === STRUCTURE_TOWER && t.my && t.energy >= 10
    })

    if (towers.length === 0) {
      // TODO: If we don't have towers, go idle for some ticks.
      // room.memory.idle = 10
      // return this.shiftUnshiftAndStop(Idle.name)
      return this.waitNextTick()
    }

    const rampartHP = {
      1: 250,
      2: 500,
      3: 750,
      4: 1000,
      5: 5000,
      6: 25000,
      7: 75000,
      8: 200000
    }

    const ramparts = room.find(FIND_MY_STRUCTURES, {
      filter: r => r.structureType === STRUCTURE_RAMPART && r.hits < rampartHP[room.controller.level]
    })

    ramparts.sort((r1, r2) => r1.hits - r2.hits)

    const roads = room.find(FIND_STRUCTURES, {
      filter: r => r.structureType === STRUCTURE_ROAD && r.hitsMax - r.hits >= 800
    })

    roads.sort((r1, r2) => r1.hits - r2.hits)

    towers.forEach((tower) => {
      const enemy = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS)

      if (enemy != null) {
        tower.attack(enemy)
      } else if (ramparts.length) {
        tower.repair(ramparts[0])
      } else if (roads.length) {
        tower.repair(roads.shift())
      }
    })

    return this.waitNextTick()
  }
}
