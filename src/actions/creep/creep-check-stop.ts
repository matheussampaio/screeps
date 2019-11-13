import * as _ from 'lodash'

import { ActionsRegistry, Action, Process } from '../../core'
import { ICreepContext } from './interfaces'

@ActionsRegistry.register
export class CreepCheckStop extends Action {
  run(context: ICreepContext, process: Process) {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    // stop if we lose access to this creep
    if (creep == null) {
      return this.halt()
    }

    // stop if another process owns this room
    if (creep.memory.PID !== process.PID) {
      return this.halt()
    }

    if (creep.getActiveBodyparts(MOVE) === 0) {
      return this.halt()
    }

    if (creep.spawning) {
      return this.waitNextTickAll()
    }

    return this.waitNextTick()
  }
}

