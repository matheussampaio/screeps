import { Agent } from '../../../agent'
import { IAction } from '../../../interfaces'
import { Substitute } from './substitute'

export const DieInPeace: IAction = {
    name: 'die-in-peace',
    run(creep: Creep) {
        if (creep.memory.substitute) {
            return Agent.WAIT_NEXT_TICK
        }

        console.log(creep.name, 'die in piece in', creep.ticksToLive - (creep.body.length * CREEP_SPAWN_TIME + 1400 ))

        if (creep.ticksToLive < creep.body.length * CREEP_SPAWN_TIME + 1400) {
            creep.memory.substitute = true

            const room = Game.rooms[creep.memory.room || creep.room.name]

            if (room != null) {
                room.queueCreep({
                    body: creep.serializeBody(),
                    name: `${creep.memory.role}_${Game.time}`,
                    memory: {
                        subTarget: creep.id,
                        actions: [[Substitute.name]]
                    }
                })
            }
        }

        return Agent.WAIT_NEXT_TICK
    }
}
