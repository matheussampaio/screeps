import { Action, ActionRegistry } from '@sae/core'
import { GetEnergyFromStorageCreepAction } from '../get-energy'

@ActionRegistry.register
export class FindCourierTargetCreepAction extends Action {
  run(creep) {
    let target

    const towers = creep.room
      .find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity - 250
      })
      .sort((a, b) => a.energy - b.energy)

    if (towers.length) {
      target = towers[0]
      creep.memory.target = target.id
    }

    if (target == null) {
      target = creep.getTarget(FIND_MY_STRUCTURES, {
        filter: s => (s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN) && !s.isFull()
      })
    }

    if (target == null && creep.room.terminal && !creep.room.terminal.isFull()) {
      target = creep.room.terminal
      creep.memory.target = creep.room.terminal.id
    }

    if (target == null) {
      return this.waitNextTick()
    }

    creep.memory.target = target.id

    return this.shiftAndContinue()
  }
}
