import * as _ from 'lodash'

import { IAnalytics } from './analytics'
import { Process, TProcessConstructor } from './process'
import { ISerializedProcessControlBlock, ProcessControlBlock } from './process-control-block'
import { ProcessRegistry } from './process-registry'

declare global {
  interface Memory {
    kernel: object
  }
}

export interface IKernelOptions {
  cpuMinimum?: number
  analytics?: IAnalytics
}

export class Kernel {
  private queue: Process[]
  private processes: { [pid: string]: Process }
  private BootProcess: TProcessConstructor
  private cpu: number
  public analytics: IAnalytics | undefined

  constructor(BootProcess: TProcessConstructor, options: IKernelOptions = {}) {
    this.BootProcess = BootProcess
    this.queue = []
    this.processes = {}
    this.cpu = options.cpuMinimum || 500
    this.analytics = options.analytics
  }

  get memory(): any {
    Memory.kernel = Memory.kernel || {}

    return Memory.kernel
  }

  set memory(value: any) {
    Memory.kernel = value
  }

  get serializedPCBs(): ISerializedProcessControlBlock[] {
    this.memory.serializedPCBs = this.memory.serializedPCBs || []

    return this.memory.serializedPCBs
  }

  set serializedPCBs(value: ISerializedProcessControlBlock[]) {
    this.memory.serializedPCBs = value
  }

  public get pidCounter(): number {
    this.memory.pidCounter = this.memory.pidCounter || 0

    return this.memory.pidCounter
  }

  public set pidCounter(value: number) {
    this.memory.pidCounter = value
  }

  public start() {
    if (Game.cpu.bucket < this.cpu) {
      return console.log('Extremely low bucket - aborting kernel start')
    }

    this.load()

    this.boot()

    this.run()

    this.save()
  }

  private load() {
    this.serializedPCBs.forEach((serializedPCB: ISerializedProcessControlBlock) => {
      const ProcessConstructor = ProcessRegistry.fetch(serializedPCB.processName)

      if (ProcessConstructor == null) {
        return console.error("Can't find ProcessConstrutor:", serializedPCB.processName)
      }

      const pcb = ProcessControlBlock.unserialize(serializedPCB)
      const process = new ProcessConstructor(this, pcb)

      this.processes[process.pcb.PID] = process
      this.queue.push(process)
    })
  }

  private run(): void {
    this.killOrphanProcesses()

    this.wakeUpProcesses()

    // we should start with high priority processes
    this.sortQueueByPriority()

    while (this.queue.length) {
      // TODO: if CPU not available, stop

      const process = this.queue.shift()

      if (process && process.isReady()) {
        if (this.analytics) {
          this.analytics.processPreRun(process)
        }

        process.run()

        if (this.analytics) {
          this.analytics.processPostRun(process)
        }
      }
    }

    // raise priority to avoid estarvation
    this.raisePriorityOfUnrunnedProcesses()
  }

  private killOrphanProcesses(): void {
    this.queue
      .filter(process => process.parentProcess == null || process.parentProcess.isDead())
      .forEach(process => process.kill())
  }

  private wakeUpProcesses(): void {
    this.queue.filter(process => process.isSleeping() && process.shouldWakeUp()).forEach(process => process.wakeUp())
  }

  private sortQueueByPriority(): void {
    this.queue.sort((p1, p2) => p2.pcb.priority - p1.pcb.priority)
  }

  private raisePriorityOfUnrunnedProcesses(): void {
    this.queue.forEach(process => (process.pcb.priority += 1))
  }

  private save() {
    this.serializedPCBs = _.filter(this.processes, (p: Process) => p.isAlive()).map((p: Process) => p.serialize())
  }

  public getProcessByPID(pid: number): Process {
    return this.processes[pid]
  }

  public getNextPID(): number {
    while (this.getProcessByPID(this.pidCounter)) {
      if (this.pidCounter >= Number.MAX_SAFE_INTEGER) {
        this.pidCounter = 0
      }

      this.pidCounter += 1
    }

    return this.pidCounter
  }

  public addProcess(process: Process): void {
    this.processes[process.pcb.PID] = process
    this.queue.push(process)
  }

  public getProcessMemory(PID: number) {
    this.memory.processMemory = this.memory.processMemory || {}
    this.memory.processMemory[PID] = this.memory.processMemory[PID] || {}

    return this.memory.processMemory[PID]
  }

  private boot() {
    if (this.getProcessByPID(0) == null && this.BootProcess) {
      const pcb = new ProcessControlBlock({
        PID: 0,
        parentPID: 0
      })

      const process = new this.BootProcess(this, pcb)

      this.addProcess(process)
    }
  }
}
