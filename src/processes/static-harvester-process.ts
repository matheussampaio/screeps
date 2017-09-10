import { RegisterProcess } from '../decorators'
import { Kernel, Process } from '../kernel'
import { CODES, MISSIONS, PRIORITY } from '../utils'

import { RoomControlProcess } from './room-control-process'

@RegisterProcess
export class StaticHarvesterProcess extends Process {
    public run(): CODES {
        const room: Room = Game.rooms[this.memory.roomName]

        if (this.memory.sources == null) {
            const sources: Source[] = room.find(FIND_SOURCES)

            this.memory.sources = {}

            for (const source of sources) {
                this.memory.sources[source.id] = 0
            }
        }

        for (const id in this.memory.sources) {
            const creep: Creep = Game.creeps[this.memory.sources[id]]

            if (creep == null) {
                const rcp = Kernel.getProcessByPID(this.parentPID) as RoomControlProcess

                if (rcp && rcp.SpawnProcess && rcp.SpawnProcess.add) {
                    rcp.SpawnProcess.add({
                        body: [MOVE, WORK, MOVE, CARRY],
                        memory: {
                            mission: MISSIONS.MOVING_TO_SOURCE
                        },
                        parentPID: this.pid,
                        priority: PRIORITY.HIGH,
                        role: 'H'
                    })
                }

            } else if (creep.memory.mission === MISSIONS.MOVING_TO_SOURCE) {
                creep.mMoveTo(Game.getObjectById(id), { next: MISSIONS.HARVESTER })

            } else if (creep.memory.mission === MISSIONS.HARVESTER) {
                if (creep.harvest(Game.getObjectById(id)) !== OK) {
                    creep.memory.mission = MISSIONS.MOVING_TO_SOURCE
                }
            } else {
                creep.memory.mission = MISSIONS.MOVING_TO_SOURCE
            }
        }

        return CODES.OK
    }

    public receiveCreep(creepName: string) {
        const creep = Game.creeps[creepName]
        console.log('receveid', creepName)

        if (creep.memory.role === 'H') {
            for (const id in this.memory.sources) {
                const creep: Creep = Game.creeps[this.memory.sources[id]]

                if (creep == null) {
                    this.memory.sources[id] = creepName
                    return
                }
            }
        }
    }
}
