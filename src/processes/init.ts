import { registerProcess } from '../decorators/registerProcess'
import { Kernel } from '../kernel'
import { Process, ProcessPriority } from '../kernel/Process'

import { RCL1Program } from './programs/rcl1'
import { RCL2Program } from './programs/rcl2'

@registerProcess
export class InitProcess extends Process {
    public run() {
        this.memory.children.rooms = this.memory.children.rooms || {}

        for (const roomName in this.memory.children.rooms) {
            if (Game.rooms[roomName] == null) {
                this.memory.children.rooms[roomName] = null
            }
        }

        for (const roomName in Game.rooms) {
            const pid = this.memory.children.rooms[roomName]

            if (pid == null || Kernel.processTable[pid] == null) {
                const room = Game.rooms[roomName]

                const programs = {
                    1: RCL1Program,
                    2: RCL2Program,

                    default: RCL2Program
                }

                const Program = programs[room.controller.level] || programs.default

                this.memory.children.rooms[roomName] = Program.fork(this.pid, { memory: { roomName } })
            }
        }
    }
}
