import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { CreepAction } from './creep-action'

@ActionsRegistry.register
export class CreepRenew extends CreepAction {
  run(context: any) {
    this.context = context

    // maximum creep, renew
    if (this.context.energy !== this.room.energyCapacityAvailable) {
      this.waitNextTick()
    }

    const ticksGainedOnRenew = Math.floor(600 / this.creep.body.length)

    if (this.creep.ticksToLive as number >= CREEP_LIFE_TIME - ticksGainedOnRenew) {
      return this.waitNextTick()
    }

    const spawn = Object.values(Game.spawns)
      .find(spawn => !spawn.spawning && spawn.room.name === this.room.name && spawn.pos.isNearTo(this.creep.pos))

    if (spawn) {
      spawn.renewCreep(this.creep)
    }

    return this.waitNextTick()
  }
}
