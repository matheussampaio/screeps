import { Agent } from '../../agent'
import { Priority } from '../../enums'
import { IAction } from '../../interfaces'
import { CreateBody } from '../../utils'
import { Substitute } from '../creep-actions'

export const Harvester1: IAction = {
    name: 'harvester-1',
    run(room: Room) {
        if (room.memory.sources == null) {
            room.memory.sources = {}

            room.find(FIND_SOURCES)
                .forEach((source: Source) => {
                    room.memory.sources[source.id] = null
                })
        }

        let harvesters = 0

        if (room.creeps.HarvesterEnergy != null) {
            harvesters = room.creeps.HarvesterEnergy.length
        }

        // otherwise, spawn a normal harvester
        if (harvesters < _.size(room.memory.sources)) {
            room.queueCreep({
                memory: {
                    role: 'HarvesterEnergy'
                },
                priority: harvesters === 0 ? Priority.VERY_HIGH : Priority.NORMAL,
                body: createHarvesterBody(room)
            })
        } else if (hasFreeEnergy(room) && Game.time % 10 === 5) {
            const body = createHarvesterBody(room)
            const oldHarvester: Creep | null = canSubstitueForABetterCreep(room, body, 'HarvesterEnergy')

            if (oldHarvester) {
                room.queueCreep({
                    body,
                    memory: {
                        role: oldHarvester.memory.role,
                        subTarget: oldHarvester.id,
                        actions: [[Substitute.name]]
                    },
                    priority: harvesters === 0 ? Priority.VERY_HIGH : Priority.NORMAL,
                })
            }
        }

        let haulers = 0

        if (room.creeps.Hauler != null) {
            haulers = room.creeps.Hauler.length
        }

        // otherwise check if we need to spawn a hauler
        if (haulers < _.size(room.memory.sources)) {
            room.queueCreep({
                memory: {
                    role: 'Hauler'
                },
                priority: haulers === 0 ? Priority.VERY_HIGH : Priority.NORMAL,
                body: createHaulerBody(room)
            })
        } else if (hasFreeEnergy(room) && Game.time % 10 === 2) {
            const body = createHaulerBody(room)
            const oldHauler: Creep | null = canSubstitueForABetterCreep(room, body, 'Hauler')

            if (oldHauler) {
                room.queueCreep({
                    body,
                    memory: {
                        role: oldHauler.memory.role,
                        subTarget: oldHauler.id,
                        actions: [[Substitute.name]]
                    },
                    priority: harvesters === 0 ? Priority.VERY_HIGH : Priority.NORMAL,
                })
            }
        }

        return Agent.SHIFT_AND_CONTINUE
    }
}

function createHarvesterBody(room: Room) {
    return new CreateBody({ minimumEnergy: 150, energy: room.energyAvailable })
        .addWithMove([WORK], { work: 2 })
        .add(CARRY)
        .add(WORK, { work: 7 })
        .add(MOVE, { move: 7 })
        .value()
}

function createHaulerBody(room: Room) {
    return new CreateBody({ minimumEnergy: 100, energy: room.energyAvailable })
        .addWithMove(CARRY, { carry: 2})
        .addWithMove(WORK)
        .addWithMove([CARRY, WORK], { carry: 20, work: 5})
        .value()
}

function hasFreeEnergy(room: Room) {
    return room.energyAvailable === room.energyCapacityAvailable && room.memory.queue.length === 0
}

function canSubstitueForABetterCreep(room: Room, body: string, role: string) {
    const creeps: Creep[] = _.filter(Game.creeps, (creep: Creep) => {
        return creep.my && creep.room.name === room.name && creep.memory.role === role
    })
    .sort((c1: Creep, c2: Creep) => {
        if (c1.body.length !== c2.body.length) {
            return c1.body.length - c2.body.length
        }

        return c1.ticksToLive - c2.ticksToLive
    })

    if (creeps.length && body.length > creeps[0].body.length) {
        return creeps[0]
    }

    return null
}
