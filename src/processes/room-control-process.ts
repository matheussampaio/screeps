import { RegisterProcess } from '../decorators'
import { Kernel, Process, ProcessRegistry } from '../kernel'

import { CODES, PRIORITY } from '../utils'

import { BuildersProgress, ControllerUpgraderProcess, EnergyCourierProcess, SpawnProcess, StaticHarvesterProcess } from './index'

@RegisterProcess
export class RoomControlProcess extends Process {
    public BuildersProcess: BuilderProcess
    public ControllerUpgraderProcess: ControllerUpgraderProcess
    public EnergyCourierProcess: EnergyCourierProcess
    public SpawnProcess: SpawnProcess
    public StaticHarvesterProcess: StaticHarvesterProcess

    public room: Room
    public creeps: any = {}

    public run(): CODES {
        this.room = Game.rooms[this.memory.roomName]

        if (this.room.controller.level >= 1) {
            this.SpawnProcess = this.start('SpawnProcess') as SpawnProcess
            this.StaticHarvesterProcess = this.start('StaticHarvesterProcess') as StaticHarvesterProcess
            this.EnergyCourierProcess = this.start('EnergyCourierProcess') as EnergyCourierProcess
            this.ControllerUpgraderProcess = this.start('ControllerUpgraderProcess', PRIORITY.LOW) as
                ControllerUpgraderProcess
        }

        if (this.room.controller.level >= 2) {
            this.BuildersProcess = this.start('BuildersProcess') as BuilderProcess
        }

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

    public start(processName: string, priority: PRIORITY = PRIORITY.NORMAL) {
        this.memory.children = this.memory.children || {}

        const childPID = this.memory.children[processName]

        if (childPID == null || Kernel.processTable[childPID] == null) {
            const ProcessCreep = ProcessRegistry.fetch(processName)
            const options = {
                memory: {
                    roomName: this.memory.roomName
                },
                priority
            }

            this.memory.children[processName] = ProcessCreep.fork(this.pid, options)
        }

        return Kernel.getProcessByPID(childPID)
    }
}
