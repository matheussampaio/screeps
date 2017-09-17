import { Agent } from '../../../agent'
import { IAction } from '../../../interfaces'
import { TravelTo } from '../commons'

export const HarvesterEnergy: IAction = {
    name: 'harvester_energy',
    run(creep: Creep) {
        const source: Source = Game.getObjectById(creep.memory.source)

        // sleep if doesnt have source
        if (source == null) {
            return Agent.WAIT_NEXT_TICK
        }

        creep.memory.room = creep.memory.room || creep.room.name

        // update source miner
        if (Game.rooms[creep.memory.room].memory.sources != null) {
            Game.rooms[creep.memory.room].memory.sources[creep.memory.source] = creep.name
        }

        // if doesnt have target, find one
        if (creep.memory.target == null) {
            return [Agent.UNSHIFT_AND_CONTINUE, FindHarvesterTarget.name]
        }

        // create container
        if (creep.getActiveBodyparts(WORK) >= 6 && source.energy === 0) {
            return [Agent.UNSHIFT_AND_CONTINUE, BuildContainer.name]
        }

        const result = creep.harvest(source)

        if (result === OK) {
            creep.memory.working = true
        }

        if (result === ERR_NOT_IN_RANGE) {
            creep.memory.travelTo = creep.memory.target
            return [Agent.UNSHIFT_AND_CONTINUE, TravelTo.name]
        }

        return Agent.SHIFT_AND_STOP
    }
}

export const FindHarvesterTarget: IAction = {
    name: 'find-harvester-target',
    run(creep: Creep) {
        const source: Source = Game.getObjectById(creep.memory.source)

        // if not working yet
        const containers: Structure[] = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: (s: Structure) => {
                return s.structureType === STRUCTURE_CONTAINER
            }
        })

        if (containers && containers.length) {
            creep.memory.target = containers[0].id
            return Agent.SHIFT_AND_CONTINUE
        }

        const containersInConstructions: ConstructionSite[] = source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, {
            filter: (s: Structure) => s.structureType === STRUCTURE_CONTAINER
        })

        if (containersInConstructions && containersInConstructions.length) {
            creep.memory.target = containersInConstructions[0].id
            return Agent.SHIFT_AND_CONTINUE
        }

        creep.memory.target = source.id

        return Agent.SHIFT_AND_CONTINUE
    }
}

export const BuildContainer: IAction = {
    name: 'build_container',
    run(creep: Creep) {
        if (creep.carry.energy === 0) {
            const energy: Resource[] = creep.pos.lookFor(LOOK_RESOURCES)

            if (energy && energy.length === 0) {
                return Agent.SHIFT_AND_STOP
            }

            creep.pickup(energy[0])
        }

        const container = creep.pos.lookFor(LOOK_STRUCTURES).find((s: Structure) => {
            return s.structureType === STRUCTURE_CONTAINER
        })

        if (container != null) {
            // TODO: Repair the container

            return Agent.SHIFT_AND_STOP
        }

        const constructions: ConstructionSite[] = creep.pos.lookFor(LOOK_CONSTRUCTION_SITES)

        if (constructions && constructions.length === 0) {
            creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER)
            return Agent.WAIT_NEXT_TICK
        }

        creep.build(constructions[0])

        return Agent.SHIFT_AND_STOP
    }
}
