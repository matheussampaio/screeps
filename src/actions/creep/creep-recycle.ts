import { ActionsRegistry } from '../../core'
import { CreepAction } from './creep-action'

@ActionsRegistry.register
export class CreepRecycle extends CreepAction {
  run(context: any) {
    this.context = context

    const spawn = Object.values(Game.spawns).find(spawn => spawn.room.name === this.room.name)

    if (spawn == null) {
      return this.waitNextTick()
    }

    if (!this.creep.pos.isNearTo(spawn)) {
      this.creep.travelTo(spawn, { range: 1, ignoreCreeps: true })

      return this.waitNextTick()
    }

    spawn.recycleCreep(this.creep)

    return this.waitNextTick()
  }
}
