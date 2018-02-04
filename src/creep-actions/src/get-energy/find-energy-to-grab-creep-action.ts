import { Action, ActionRegistry } from '../../../engine'


@ActionRegistry.register
export class FindEnergyToGrabCreepAction extends Action {
    run(creep: Creep) {
        // try to pickup dropped energy
        const resource: Resource = _.sample(creep.room.find(FIND_DROPPED_RESOURCES))

        if (resource != null) {
            creep.memory.energy = resource.id

            return this.shiftAndContinue()
        }

        // try to find a container
        const containers: StructureContainer[] = creep.room.find(FIND_STRUCTURES, {
            filter: (s: StructureContainer) => s.structureType === STRUCTURE_CONTAINER && s.store.energy > 0,
        }) as StructureContainer[]

        // get the container with more energy
        const container: StructureContainer | number = _.max(containers, (container: StructureContainer) => {
            return container.store.energy
        })

        if (container instanceof StructureContainer && container != null) {
            creep.memory.energy = container.id

            return this.shiftAndContinue()
        }

        return this.waitNextTick()
    }
}
