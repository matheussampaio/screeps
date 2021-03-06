import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { CreepAction } from './creep-action'

@ActionsRegistry.register
export class CreepRemoteReserver extends CreepAction {
  run(context: any) {
    this.context = context

    if (this.context.remoteRoom == null) {
      return this.waitNextTick()
    }

    if (this.context.remoteRoom !== this.creep.room.name) {
      const pos = new RoomPosition(25, 25, this.context.remoteRoom)

      this.creep.travelTo(pos, { range: 22, ignoreCreeps: true })

      return this.waitNextTick()
    }

    const remoteController = this.creep.room.controller

    if (remoteController == null) {
      console.log('controller is null')

      return this.waitNextTick()
    }

    if (!this.creep.pos.isNearTo(remoteController)) {
      this.creep.travelTo(remoteController, { range: 1, ignoreCreeps: true })

      return this.waitNextTick()
    }

    const username = _.get(this.controller, 'owner.username')

    const reservationUsername = _.get(remoteController, 'reservation.username', username)
    const ticksToEnd = _.get(remoteController, 'reservation.ticksToEnd', 0)

    if (reservationUsername === username && ticksToEnd < CONTROLLER_RESERVE_MAX - 5) {
      this.creep.reserveController(remoteController)
    } else {
      this.creep.attackController(remoteController)
    }

    if (reservationUsername === 'Invader') {
      Memory.enemies[this.creep.room.name] = {
        time: Game.time,
        attackPower: 1000
      }
    }

    return this.waitNextTick()
  }
}

