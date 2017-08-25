import { registerProcess } from '../../decorators/registerProcess'
import { RCLProgram } from './rcl'

import { SHUCreep } from '../creeps/shu'

// FIXME: this is a hack to include SHU file
SHUCreep.touch()

@registerProcess
export class RCL2Program extends RCLProgram {
    public get level() {
        return 2
    }

    public static toString() {
        return 'process.RCL2Program'
    }

    public run() {
        if (!super.run()) {
            return false
        }

        if (this.getCreepsNumber() < 10) {
            this.spawn.add({
                body: [MOVE, WORK, MOVE, CARRY],
                memory: { roomName: this.memory.roomName },
                parentPID: this.pid,
                process: 'SHUCreep'
            })
        }

        return true
    }

    public receiveCreep(pid: number, creepName: string, processName: string) {
        this.memory.children.creeps[pid] = { creepName, processName }
    }
}
