import { Action, ActionRegistry } from '@sae/core'

@ActionRegistry.register
export class FindSource extends Action {
  run(creep) {
    _.defaults(creep.room.memory, {
      sources: {}
    })

    const sources = creep.room.find(FIND_SOURCES).filter(source => {
      const creepName = creep.room.memory.sources[source.id]

      return Game.creeps[creepName] == null
    })

    // TODO: if more than one source, sort them by distance

    for (const source of sources) {
      const harvester = source.pos.findInRange(FIND_MY_CREEPS, 1).find(c => c.memory.role === 'HarvesterEnergy')

      if (harvester == null) {
        creep.memory.source = source.id
        creep.room.memory.sources[source.id] = creep.name

        return this.shiftAndContinue()
      }
    }

    return this.waitNextTick()
  }
}
