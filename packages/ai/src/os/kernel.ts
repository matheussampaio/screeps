import _ from 'lodash'

import { Process, TProcessConstructor } from './process'
import {
  ISerializedProcessControlBlock,
  ProcessControlBlock
} from './process-control-block'
import { ProcessRegistry } from './process-registry'

export class Kernel {
  private static queue: Process[] = []
  private static processes: { [pid: string]: Process } = {}

  static get memory(): any {
    Memory.kernel = Memory.kernel || {}

    return Memory.kernel
  }

  static set memory(value: any) {
    Memory.kernel = value
  }

  static get serializedPCBs(): ISerializedProcessControlBlock[] {
    this.memory.serializedPCBs = this.memory.serializedPCBs || []

    return this.memory.serializedPCBs
  }

  static set serializedPCBs(value: ISerializedProcessControlBlock[]) {
    this.memory.serializedPCBs = value
  }

  public static get pidCounter(): number {
    this.memory.pidCounter = this.memory.pidCounter || 0

    return this.memory.pidCounter
  }

  public static set pidCounter(value: number) {
    this.memory.pidCounter = value
  }

  public static start() {
    this.load()

    this.run()

    this.save()
  }

  private static load() {
    this.serializedPCBs.forEach(
      (serializedPCB: ISerializedProcessControlBlock) => {
        const ProcessConstructor = ProcessRegistry.fetch(
          serializedPCB.processName
        )

        if (ProcessConstructor == null) {
          return console.warn(
            "Can't find ProcessConstrutor:",
            serializedPCB.processName
          )
        }

        const pcb = ProcessControlBlock.unserialize(serializedPCB)
        const process = new ProcessConstructor(pcb)

        this.processes[process.pcb.PID] = process
        this.queue.push(process)
      }
    )
  }

  private static run(): void {
    this.killOrphanProcesses()

    this.wakeUpProcesses()

    // we should start with high priority processes
    this.sortQueueByPriority()

    while (this.queue.length) {
      // TODO: if CPU not available, stop

      const process = this.queue.shift()

      if (process && process.isReady()) {
        process.run()
      }
    }

    // raise priority to avoid estarvation
    this.raisePriorityOfUnrunnedProcesses()
  }

  private static killOrphanProcesses(): void {
    this.queue
    .filter(
      process =>
      process.parentProcess == null || process.parentProcess.isDead()
    )
    .forEach(process => process.kill())
  }

  private static wakeUpProcesses(): void {
    this.queue
    .filter(process => process.isSleeping() && process.shouldWakeUp())
    .forEach(process => process.wakeUp())
  }

  private static sortQueueByPriority(): void {
    this.queue.sort((p1, p2) => p2.pcb.priority - p1.pcb.priority)
  }

  private static raisePriorityOfUnrunnedProcesses(): void {
    this.queue.forEach(process => (process.pcb.priority += 1))
  }

  private static save() {
    this.serializedPCBs = _.filter(this.processes, (p: Process) => p.isAlive())
      .map((p: Process) => p.serialize())
  }

  public static getProcessByPID(pid: number): Process {
    return this.processes[pid]
  }


  public static getNextPID(): number {
    while (this.getProcessByPID(this.pidCounter)) {
      if (this.pidCounter >= Number.MAX_SAFE_INTEGER) {
        this.pidCounter = 0
      }

      this.pidCounter += 1
    }

    return this.pidCounter
  }
}
