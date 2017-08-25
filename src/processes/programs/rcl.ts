import { registerProcess } from '../../decorators/registerProcess'
import { Kernel } from '../../kernel'
import { Process } from '../../kernel/Process'

import { SHUCreep } from '../creeps/shu'
import { SpawnProcess } from '../spawn'

// FIXME: this is a hack to include SHU file
SHUCreep.touch()

@registerProcess
export abstract class RCLProgram extends Process {
    public abstract get level(): number

    public spawn: SpawnProcess

    public run() {
        if (!this.checkIfRoomIsOK()) {
            console.log('stop beacuse room is not ok')
            this.stop()
            return false
        }

        this.cleanChildren()

        this.spawn = this.getOrForkSpawn()

        return true
    }

    public checkIfRoomIsOK() {
        const room = Game.rooms[this.memory.roomName]

        return room != null && room.controller.level === this.level
    }

    public getCreepsNumber(): number {
        this.memory.children.creeps = this.memory.children.creeps || (this.memory.children.creeps = {})

        return Object.keys(this.memory.children.creeps).length
    }

    public getOrForkSpawn(): SpawnProcess {
        if (this.memory.children.spawn == null || Kernel.processTable[this.memory.children.spawn] == null) {
            this.memory.children.spawn = SpawnProcess.fork(this.pid, { memory: { roomName: this.memory.roomName } })
        }

        return Kernel.getProcessByPID(this.memory.children.spawn) as SpawnProcess
    }

    public abstract receiveCreep(pid: number, creepName: string, processName: string): void
}
