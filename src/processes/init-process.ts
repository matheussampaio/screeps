import { RegisterProcess } from '../decorators'
import { Kernel, Process } from '../kernel'
import { CODES, PRIORITY } from '../utils'

import { RoomControlProcess } from './room-control-process'

@RegisterProcess
export class InitProcess extends Process {
    public run() {
        this.memory.rooms = this.memory.rooms || {}

        for (const roomName in Game.rooms) {
            const pid = this.memory.rooms[roomName]

            if (pid == null || Kernel.processTable[pid] == null) {
                const options = {
                    memory: {
                        roomName
                    },
                    priority: PRIORITY.HIGH
                }

                this.memory.rooms[roomName] = RoomControlProcess.fork(this.pid, options)
            }
        }

        return CODES.OK
    }
}
