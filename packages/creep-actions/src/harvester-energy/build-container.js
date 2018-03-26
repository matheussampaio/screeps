import { Action, ActionRegistry } from '@sae/core'

@ActionRegistry.register
export class BuildContainer extends Action {
    run(creep) {
        if (creep.carry.energy === 0) {
            const energy = creep.pos.lookFor(LOOK_RESOURCES)

            if (energy && energy.length === 0) {
                return this.shiftAndStop()
            }

            creep.pickup(energy[0])
        }

        const container = creep.pos.lookFor(LOOK_STRUCTURES).find((s) => {
            return s.structureType === STRUCTURE_CONTAINER
        })

        if (container != null) {
            if (container.hits < container.hitsMax) {
                creep.repair(container)
            }

            return this.shiftAndStop()
        }

        const constructions = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES)

        if (constructions && constructions.length === 0) {
            creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER)
            return this.waitNextTick()
        }

        creep.build(constructions[0])

        return this.shiftAndStop()
    }
}
