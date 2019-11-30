import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { CreepAction } from './creep-action'
import { CreepRecycle } from './creep-recycle'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CreepGuard extends CreepAction {
  run(context: any) {
    this.context = context

    if (Memory.enemies == null) {
      Memory.enemies = {}
    }

    for (const roomName of this.roomsToGuard) {
      if (Memory.enemies[roomName]) {
        this.context.defendRoom = roomName

        return this.unshiftAndContinue(CreepGuardAttack.name)
      }
    }

    if (this.creep.hits < this.creep.hitsMax) {
      this.creep.heal(this.creep)
    }

    if (this.creep.room.name !== this.room.name) {
      const pos = new RoomPosition(25, 25, this.room.name)

      this.creep.travelTo(pos, { range: 23, ignoreCreeps: true })

      return this.waitNextTick()
    }

    const spawn = this.getSpawn()

    if (spawn == null) {
      return this.waitNextTick()
    }

    if (!this.creep.pos.isNearTo(spawn)) {
      this.creep.travelTo(spawn, { range: 1, ignoreCreeps: true })

      return this.waitNextTick()
    }

    return this.unshiftAndContinue(CreepRecycle.name)
  }

  protected get roomsToGuard(): string[] {
    const cityProcess = this.getProcessByPID(this.context.cityPID)

    if (cityProcess == null) {
      return []
    }

    const remotes = _.get(cityProcess, 'memory.remotes', {})

    return Object.keys(remotes)
  }

  protected getSpawn(): StructureSpawn | null {
    if (Game.getObjectById(this.context.spawn) == null) {
      const spawn = Object.values(Game.spawns).find(spawn => spawn.room.name === this.room.name)

      if (spawn == null) {
        return null
      }

      this.context.spawn = spawn.id
    }

    return Game.getObjectById(this.context.spawn)
  }
}

@ActionsRegistry.register
export class CreepGuardAttack extends CreepGuard {
  run(context: any) {
    this.context = context

    if (this.creep.room.name !== this.context.defendRoom) {
      const pos = new RoomPosition(25, 25, this.context.defendRoom)

      this.creep.travelTo(pos, { range: 23, ignoreCreeps: true })

      return this.waitNextTick()
    }

    const enemies = this.creep.room.find(FIND_HOSTILE_CREEPS)
      .sort((c1, c2) => utils.getEnemyAttackPower(c2) - utils.getEnemyAttackPower(c1))

    if (enemies.length) {
      this.attack(enemies.sort((c1, c2) => utils.getEnemyAttackPower(c2) - utils.getEnemyAttackPower(c1)))

      this.creep.travelTo(enemies[0], { range: 1, movingTarget: true })

      return this.waitNextTick()
    }

    const invaderCore = this.creep.room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_INVADER_CORE
    }) as StructureInvaderCore[]

    if (invaderCore.length) {
      this.attack(invaderCore)

      this.creep.travelTo(invaderCore[0], { range: 1 })

      return this.waitNextTick()
    }

    delete Memory.enemies[this.creep.room.name]

    return this.shiftAndContinue()
  }

  attack(targets: (Creep | StructureInvaderCore)[]) {
    const enemiesInRange = targets.filter(c => this.creep.pos.inRangeTo(c, 3))

    if (this.creep.getActiveBodyparts(RANGED_ATTACK) && enemiesInRange.length) {
      this.creep.rangedAttack(enemiesInRange[0])
    } else if (this.creep.getActiveBodyparts(HEAL) && this.creep.hits < this.creep.hitsMax) {
      this.creep.rangedHeal(this.creep)
    }

    const enemiesNear = targets.filter(c => this.creep.pos.isNearTo(c))

    if (this.creep.getActiveBodyparts(ATTACK) && enemiesNear.length) {
      this.creep.attack(enemiesNear[0])
    } else if (this.creep.getActiveBodyparts(HEAL) && this.creep.hits < this.creep.hitsMax) {
      this.creep.heal(this.creep)
    }
  }
}
