import { Agent } from '../../../agent'
import { IAction } from '../../../interfaces'

export const HarvesterEnergy: IAction = {
    name: 'harvester_energy',
    run(creep: Creep) {
        const source: Source | null = Game.getObjectById(creep.memory.source)

        // sleep if doesnt have source
        if (source == null) {
            return [Agent.UNSHIFT_AND_CONTINUE, FindSource.name]
        }

        creep.memory.room = creep.memory.room || creep.room.name

        // update source miner
        if (Game.rooms[creep.memory.room].memory.sources != null) {
            Game.rooms[creep.memory.room].memory.sources[creep.memory.source] = creep.name
        }

        // if doesnt have target, find one
        if (creep.memory.target == null) {
            return [Agent.UNSHIFT_AND_CONTINUE, FindMovementTarget.name]
        }

        const target: RoomPosition | null = creep.room.getPositionAt(creep.memory.target.x, creep.memory.target.y)

        if (target && !creep.pos.isEqualTo(target)) {
            creep.travelTo(target)
            return Agent.SHIFT_AND_STOP
        }

        // create container
        if (creep.memory.working && creep.getActiveBodyparts(WORK) && creep.getActiveBodyparts(CARRY) && Game.time % 10 === 0) {
            return [Agent.UNSHIFT_AND_CONTINUE, BuildContainer.name]
        }

        if (source.energy) {
            const result = creep.harvest(source)

            if (result === OK) {
                creep.memory.working = true
            }
        }

        return Agent.SHIFT_AND_STOP
    }
}

export const FindSource: IAction = {
    name: 'find-source',
    run(creep: Creep) {
        const sources: Source[] = creep.room.find(FIND_SOURCES).filter((source: Source) => {
            const creepName = creep.room.memory.sources[source.id]

            return Game.creeps[creepName] == null
        }) as Source[]

        // TODO: if more than one source, sort them by distance

        for (const source of sources) {
            const harvester = source.pos.findInRange(FIND_MY_CREEPS, 1).find((c: Creep) => {
                return c.memory.role === 'HarvesterEnergy'
            })

            if (harvester == null) {
                creep.memory.source = source.id
                creep.room.memory.sources[source.id] = creep.name

                return Agent.SHIFT_AND_CONTINUE
            }
        }

        return Agent.WAIT_NEXT_TICK
    }
}

export const FindMovementTarget: IAction = {
    name: 'find-movement-target',
    run(creep: Creep) {
        const source: Source | null = Game.getObjectById(creep.memory.source)

        if (source == null) {
            creep.memory.source = undefined
            return Agent.SHIFT_AND_STOP
        }

        // if not working yet
        const containers: Structure[] = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: (s: Structure) => {
                return s.structureType === STRUCTURE_CONTAINER
            }
        })

        if (containers && containers.length) {
            creep.memory.target = containers[0].pos
            return Agent.SHIFT_AND_CONTINUE
        }

        const containersInConstructions: ConstructionSite[] = source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, {
            filter: (s: Structure) => s.structureType === STRUCTURE_CONTAINER
        })

        if (containersInConstructions && containersInConstructions.length) {
            creep.memory.target = containersInConstructions[0].pos
            return Agent.SHIFT_AND_CONTINUE
        }

        const path = creep.pos.findPathTo(source)

        creep.memory.target = path[path.length - 2]

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

        const container: StructureContainer = creep.pos.lookFor(LOOK_STRUCTURES).find((s: Structure) => {
            return s.structureType === STRUCTURE_CONTAINER
        }) as StructureContainer

        if (container != null) {
            console.log('repair result', creep.repair(container))

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
