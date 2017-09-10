import { Kernel } from '../kernel'
import { CODES, PRIORITY } from '../utils'

export enum ProcessStatus {
    Dead = 0,
    Alive,
    Idle
}

export class Process {
    public static fork(...args: any[]) {
        return new this(...args).pid
    }

    public memory: any
    public parentPID: number
    public pid: number
    public priority: PRIORITY
    public status: ProcessStatus

    constructor(parentPID: number, options: any = {}) {
        _.defaults(options, {
            memory: {},
            pid: -1,
            priority: PRIORITY.NORMAL,
            status:  ProcessStatus.Alive
        })

        this.priority = options.priority
        this.status = options.status
        this.pid = options.pid !== -1 ? options.pid : Kernel.getNextPID()

        if (parentPID === -1) {
            throw new Error('missing parentPID')
        }

        this.parentPID = parentPID

        this.memory = _.merge(Kernel.getProcessMemory(this.pid), options.memory)

        this.memory.processName = this.memory.processName || this.constructor.name

        Kernel.addProcess(this)
    }

    public stop(): CODES {
        Kernel.killProcess(this.pid)

        const parent = Kernel.getProcessByPID(this.parentPID)

        if (parent != null && parent.notifyStop) {
            parent.notifyStop(this.pid)
        }

        return CODES.OK
    }

    public idle(wakeAt?: number): CODES {
        this.status = ProcessStatus.Idle

        if (wakeAt != null) {
            this.memory.wakeAt = Game.time + wakeAt
        }

        return CODES.OK
    }

    public wakeUp(): CODES {
        this.status = ProcessStatus.Alive

        delete this.memory.wakeAt

        return CODES.OK
    }

    public notifyStop(pid: number) {
        this.memory.children = this.memory.children || {}

        _.keys(this.memory.children).forEach((key: string) => {
            if (this.memory.children[key][pid]) {
                delete this.memory.children[key][pid]
            }
        })
    }

    public serialize() {
        return [this.pid, this.parentPID, this.constructor.name, this.priority, this.status]
    }

    public run(): CODES {
        return CODES.OK
    }
}
