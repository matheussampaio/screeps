import * as _ from 'lodash'

import { Action, Process } from '../../core'
import { ICreepContext } from './interfaces'

export class CreepAction extends Action {
  protected context: any

  run(context: ICreepContext, process: Process) {
    this.context = context

    return this.waitNextTick()
  }

  protected get creep(): Creep {
    return Game.creeps[this.context.creepName]
  }

  protected get room(): Room {
    return Game.rooms[this.creep.memory.roomName]
  }

  protected get storage(): StructureStorage | undefined {
    return this.room.storage
  }

  protected get controller(): StructureController | undefined {
    return this.room.controller
  }

  protected get remoteRoom(): Room {
    return Game.rooms[this.context.remoteRoomName]
  }

  protected get remoteController(): StructureController | undefined {
    if (this.remoteRoom) {
      return this.remoteRoom.controller
    }

    return undefined
  }

  protected get terminal(): StructureTerminal | undefined {
    return this.room.terminal
  }
}
