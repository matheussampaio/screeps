import { Kernel } from '../kernel';

export enum ProcessPriority {
    High = 1,
    Normal,
    Low
}

export enum ProcessStatus {
    Dead = 0,
    Alive
}

export abstract class Process {
    public static fork(...args: any[]) {
        return new this(...args).pid
    }

    public memory: any
    public parentPID: number
    public pid: number
    public priority: ProcessPriority
    public status: ProcessStatus

    constructor(parentPID: number, { memory = {}, pid = -1, priority = ProcessPriority.Normal } = {}) {
        this.priority = priority
        this.status = ProcessStatus.Alive
        this.pid = pid !== -1 ? pid : Kernel.getNextPID()

        if (parentPID === -1) {
            throw new Error('missing parentPID')
        }

        this.parentPID = parentPID

        this.memory = _.merge(Kernel.getProcessMemory(this.pid), memory)

        this.memory.children = this.memory.children || {}
        this.memory.processName = this.memory.processName || this.constructor.name

        Kernel.addProcess(this)
    }

    public setMemory(memory: any) {
        this.memory = memory
    }

    public stop() {
        Kernel.killProcess(this.pid)

        const parent = Kernel.getProcessByPID(this.parentPID)

        if (parent != null && parent.notifyStop) {
            parent.notifyStop(this.pid)
        }
    }

    public notifyStop(pid: number) {
        this.memory.children = this.memory.children || {}

        _.keys(this.memory.children, (key: string) => {
            if (this.memory.children[key][pid]) {
                delete this.memory.children[key][pid]
            }
        })
    }

    public cleanChildren() {
        _.forIn(this.memory.children, (value: any, key: string) => {
            if (_.isNumber(value) && Kernel.getProcessByPID(value) == null) {
                delete this.memory.children[key]

            } else if (_.isArray(value)) {
                this.memory.children[key] = value.filter((pid: number) => Kernel.getProcessByPID(pid) != null)

            } else {
                _.forIn(value, (__: any, pid: string) => {
                    if (Kernel.getProcessByPID(parseInt(pid, 10)) == null) {
                        delete value[pid]
                    }
                })
            }
        })
    }

    public serialize() {
        return [this.pid, this.parentPID, this.constructor.name, this.priority]
    }

    public abstract run(): boolean
}
