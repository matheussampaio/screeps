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
                body: CreateBody.harvester(room.energyAvailable)
            })
        } else if (room.hasFreeEnergy() && Game.time % 10 === 5) {
            const body = CreateBody.harvester(room.energyAvailable)
            const oldHarvester: Creep | null = room.canSubstitueForABetterCreep(body, 'HarvesterEnergy')

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
                body:CreateBody.hauler(room.energyAvailable)
            })
        } else if (room.hasFreeEnergy() && Game.time % 10 === 2) {
            const body = CreateBody.hauler(room.energyAvailable)
            const oldHauler: Creep | null = room.canSubstitueForABetterCreep(body, 'Hauler')

            if (oldHauler) {
                room.queueCreep({
                    body,
                    memory: {
                        role: oldHauler.memory.role,
                        subTarget: oldHauler.id,
                        actions: [[Substitute.name]]
                    },
                    priority: haulers === 0 ? Priority.VERY_HIGH : Priority.NORMAL,
                })
            }
        }

        return Agent.SHIFT_AND_CONTINUE
    }
}
