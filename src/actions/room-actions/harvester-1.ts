import { Agent } from '../../agent'
import { Priority } from '../../enums'
import { IAction } from '../../interfaces'
import { CreateBody } from '../../utils'

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
                body: new CreateBody({ minimumEnergy: 150, energy: room.energyAvailable })
                    .addWithMove([WORK], { work: 2 })
                    .add(CARRY)
                    .add(WORK, { work: 7 })
                    .add(MOVE, { move: 7 })
                    .value()
            })
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
                body: new CreateBody({ minimumEnergy: 100, energy: room.energyAvailable })
                    .addWithMove(CARRY, { carry: 2})
                    .addWithMove(WORK)
                    .addWithMove([CARRY, WORK], { carry: 20, work: 5})
                    .value()
            })
        }

        return Agent.SHIFT_AND_CONTINUE
    }
}
