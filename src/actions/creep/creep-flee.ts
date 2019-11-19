import { ActionsRegistry } from '../../core'
import { CreepAction } from './creep-action'

@ActionsRegistry.register
export class CreepFlee extends CreepAction {
  run(context: any) {
    this.context = context

    if (Memory.enemies == null) {
      Memory.enemies = {}
    }

    if (Memory.enemies[this.creep.room.name]) {
      this.context.afraidOf = this.creep.room.name

      return this.unshiftAndContinue(CreepFleeAfraid.name)
    }

    const enemies = this.creep.room.find(FIND_HOSTILE_CREEPS)

    if (enemies.length) {
      this.context.afraidOf = this.creep.room.name

      Memory.enemies[this.creep.room.name] = Game.time

      return this.unshiftAndContinue(CreepFleeAfraid.name)
    } else {
      delete Memory.enemies[this.creep.room.name]
    }

    return this.waitNextTick()
  }
}

@ActionsRegistry.register
export class CreepFleeAfraid extends CreepAction {
  run(context: any) {
    this.context = context

    if (Memory.enemies[this.context.afraidOf] == null) {
      return this.shiftAndContinue()
    }

    const pos = new RoomPosition(25, 25, this.room.name)

    if (!this.creep.pos.inRangeTo(pos, 20)) {
      this.creep.travelTo(pos, { ignoreCreeps: false, range: 15 })

      return this.waitNextTickAll()
    }

    const enemies = this.creep.room.find(FIND_HOSTILE_CREEPS)

    const goals = enemies.map(c => ({ pos: c.pos, range: 4 }))

    const result = PathFinder.search(this.creep.pos, goals, { flee: true })

    if (result.incomplete) {
      this.creep.travelTo(this.controller as StructureController)

      return this.waitNextTickAll()
    }

    this.creep.moveByPath(result.path)

    return this.waitNextTickAll()
  }
}
