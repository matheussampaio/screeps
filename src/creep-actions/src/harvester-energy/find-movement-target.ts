import { Action, ActionRegistry } from '../../../engine'


@ActionRegistry.register
export class FindMovementTarget extends Action {
    run(creep: Creep) {
        const source: Source | null = Game.getObjectById(creep.memory.source)

        if (source == null) {
            creep.memory.source = undefined
            return this.shiftAndStop()
        }

        // if not working yet
        const containers: Structure[] = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: (s: Structure) => {
                return s.structureType === STRUCTURE_CONTAINER
            }
        })

        if (containers && containers.length) {
            creep.memory.target = containers[0].pos
            return this.shiftAndContinue()
        }

        const containersInConstructions: ConstructionSite[] = source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, {
            filter: (s: Structure) => s.structureType === STRUCTURE_CONTAINER
        })

        if (containersInConstructions && containersInConstructions.length) {
            creep.memory.target = containersInConstructions[0].pos
            return this.shiftAndContinue()
        }

        const path = creep.pos.findPathTo(source)

        creep.memory.target = path[path.length - 2]

        return this.shiftAndContinue()
    }
}
