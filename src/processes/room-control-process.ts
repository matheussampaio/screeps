import { RegisterProcess } from '../decorators'
import { Kernel, Process, ProcessRegistry } from '../kernel'
import { CODES } from '../utils'
import { SpawnProcess } from './spawn-process'

@RegisterProcess
export class RoomControlProcess extends Process {
    public spawner: SpawnProcess
    // public upgrader: UpgraderProcess

    public room: Room
    public creeps: any = {}

    public run(): CODES {
        this.room = Game.rooms[this.memory.roomName]

        if (this.room.controller.level >= 1) {
            this.spawner = this.start('SpawnProcess') as SpawnProcess
        }

        // if (this.room.controller.level >= 2) {
        //
        // }
        //
        // if (this.room.controller.level >= 3) {
        //
        // }
        //
        // if (this.room.controller.level >= 4) {
        //
        // }

        return CODES.OK
    }

    public start(processName: string) {
        const childPID = this.memory.children[processName]

        if (childPID == null || Kernel.processTable[childPID] == null) {
            const ProcessCreep = ProcessRegistry.fetch(processName)
            const options = {
                memory: {
                    roomName: this.memory.roomName
                }
            }

            this.memory.children[processName] = ProcessCreep.fork(this.pid, options)
        }

        return Kernel.getProcessByPID(childPID)
    }
}
