import { Process, ProcessStatus } from './process'
import { ProcessRegistry } from './process-registry'

export class Kernel {
    public static processTable: { [pid: string]: Process } = {}
    public static queue: Process[] = []

    public static load() {
        this.loadProcessTable()
        this.garbageCollection()
    }

    public static run() {
        while (this.queue.length) {
            let process = this.queue.pop()

            while (process) {
                if (this.getProcessByPID(process.parentPID) == null) {
                    process.stop()
                }

                if (process.status === ProcessStatus.Idle && process.memory.wakeAt <= Game.time) {
                    process.wakeUp()
                }

                if (process.status === ProcessStatus.Alive) {
                    try {
                        const cpu = Game.cpu.getUsed()

                        process.run()

                        console.log(`${process.constructor.name}: + ${(Game.cpu.getUsed() - cpu).toFixed(3)}`)
                    } catch (error) {
                        console.log(error.stack)

                        process.stop()
                    }
                }

                process = this.queue.pop()
            }
        }
    }

    public static save() {
        this.storeProcessTable()
    }

    public static addProcess(process: Process) {
        this.processTable[process.pid] = process
        this.storeProcessTable()
    }

    public static getProcessByPID(pid: number) {
        return this.processTable[pid]
    }

    public static getNextPID() {
        Memory.pidCounter = Memory.pidCounter || 0

        while (this.getProcessByPID(Memory.pidCounter)) {
            if (Memory.pidCounter >= Number.MAX_SAFE_INTEGER) {
                Memory.pidCounter = 0
            }

            Memory.pidCounter++
        }

        return Memory.pidCounter
    }

    public static getProcessMemory(pid: number) {
        Memory.processMemory = Memory.processMemory || {}
        Memory.processMemory[pid] = Memory.processMemory[pid] || {}

        return Memory.processMemory[pid]
    }

    public static storeProcessTable() {
        Memory.processTable = _.filter(this.processTable, (p: Process) => p.status !== ProcessStatus.Dead)
            .sort((a: Process, b: Process) => a.priority - b.priority)
            .map((p: Process) => [p.pid, p.parentPID, p.constructor.name, p.priority])
    }

    public static killProcess(pid: number) {
        this.processTable[pid].status = ProcessStatus.Dead
        Memory.processMemory[pid] = null

        for (const otherPid in this.processTable) {
            const process = this.processTable[otherPid]

            if (process.parentPID === pid && process.status !== ProcessStatus.Dead) {
                this.killProcess(process.pid)
            }
        }
    }

    private static garbageCollection() {
        Memory.processMemory = _.pick(Memory.processMemory, (_: any, k: string) => this.processTable[k] != null)
        Memory.creeps = _.pick(Memory.creeps, (_: any, k: string) => Game.creeps[k] != null)
        Memory.rooms = _.pick(Memory.rooms, (_: any, k: string) => Game.rooms[k] != null)
    }

    private static loadProcessTable() {
        this.processTable = {}
        this.queue = []

        Memory.processTable = Memory.processTable || []

        for (const [pid, parentPID, processName, priority] of Memory.processTable) {
            const ProcessClass = ProcessRegistry.fetch(processName)

            if (ProcessClass == null) {
                continue
            }

            const process = new ProcessClass(parentPID, { pid, priority })

            this.processTable[pid] = process
            this.queue.push(process)
        }
    }
}
