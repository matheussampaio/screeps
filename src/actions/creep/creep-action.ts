import * as _ from 'lodash'

import { Action } from '../../core'
import { ICreepContext } from './interfaces'

export class CreepAction extends Action {
  protected context: any

  run(context: ICreepContext) {
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
}
