import * as _ from 'lodash'

import { ActionsRegistry, Process } from '../../core'
import { ICreepContext } from './interfaces'
import { CreepAction } from './creep-action'

@ActionsRegistry.register
export class CreepCheckStop extends CreepAction {
  run(context: ICreepContext, process: Process) {
    this.context = context

    // stop if we lose access to this creep
    if (this.creep == null) {
      return this.halt()
    }

    // stop if another process owns this creep
    if (this.creep.memory.PID !== process.PID) {
      return this.halt()
    }

    if (this.creep.getActiveBodyparts(MOVE) === 0) {
      this.creep.suicide()

      return this.halt()
    }

    if (this.creep.spawning) {
      return this.waitNextTickAll()
    }

    return this.waitNextTick()
  }
}

