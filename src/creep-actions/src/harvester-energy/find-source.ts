import { Action, ActionRegistry } from "../../../engine"

@ActionRegistry.register
export class FindSource extends Action {
    run(creep: Creep) {
        _.defaults(creep.room.memory, {
            sources: {}
        })

        const sources: Source[] = creep.room.find(FIND_SOURCES).filter((source: Source) => {
            const creepName = creep.room.memory.sources[source.id]

            return Game.creeps[creepName] == null
        }) as Source[]

        // TODO: if more than one source, sort them by distance

        for (const source of sources) {
            const harvester = source.pos.findInRange(FIND_MY_CREEPS, 1).find((c: Creep) => {
                return c.memory.role === "HarvesterEnergy"
            })

            if (harvester == null) {
                creep.memory.source = source.id
                creep.room.memory.sources[source.id] = creep.name

                return this.shiftAndContinue()
            }
        }

        return this.waitNextTick()
    }
}
