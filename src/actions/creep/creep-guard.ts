import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { CreepAction } from './creep-action'
import { CreepRecycle } from './creep-recycle'

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

      this.creep.travelTo(pos, { ignoreCreeps: true, range: 23 })

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

    this.logger.info(`Defending room ${this.creep.room.name}`)

    if (this.creep.room.name !== this.context.defendRoom) {
      const pos = new RoomPosition(25, 25, this.context.defendRoom)

      this.creep.travelTo(pos, { ignoreCreeps: true, range: 23 })

      return this.waitNextTick()
    }

    const enemy = this.creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS)

    if (enemy == null) {
      this.logger.info(`Room ${this.creep.room.name} cleaned!`)

      delete Memory.enemies[this.creep.room.name]

      return this.shiftAndContinue()
    }

    if (this.creep.hits < this.creep.hitsMax) {
      this.creep.heal(this.creep)
    }

    if (this.creep.getActiveBodyparts(RANGED_ATTACK) && this.creep.pos.inRangeTo(enemy.pos, 3)) {
      this.creep.rangedAttack(enemy)
    }

    if (this.creep.getActiveBodyparts(ATTACK) && this.creep.pos.isNearTo(enemy.pos)) {
      this.creep.attack(enemy)
    }

    this.creep.travelTo(enemy, { range: 1, movingTarget: true })

    return this.waitNextTick()
  }
}
