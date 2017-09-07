import { Kernel } from '../../../kernel'
import { SpawnProcess } from '../../spawn'
import { RCLProgram } from '../rcl'

export class SpawnTasks {
    public static getOrForkSpawn(rcl: RCLProgram) {
        if (rcl.memory.children.spawn == null || Kernel.processTable[rcl.memory.children.spawn] == null) {
            rcl.memory.children.spawn = SpawnProcess.fork(rcl.pid, { memory: { roomName: rcl.memory.roomName } })
        }

        rcl.spawn = Kernel.getProcessByPID(rcl.memory.children.spawn) as SpawnProcess

        return rcl.spawn != null
    }
}
