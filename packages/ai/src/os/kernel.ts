import { Process, TProcessConstructor } from './process'
import { ProcessRegistry } from './process-registry'

interface ISerializedProcessTableItem {
  processName: string
}

export class Kernel {
  private static processTable: { [pid: string]: Process } = {}
  private static queue: Process[] = []

  static get serializedProcessTable(): ISerializedProcessTableItem[] {
    Memory.processTable = Memory.processTable || []

    return Memory.processTable
  }

  public static start() {
    this.load()

    this.run()

    this.save()
  }

  private static load() {
    this.processTable = {}

    this.serializedProcessTable.forEach(processTableItem => {
      const ProcessConstructor = ProcessRegistry.getProcessConstructorFromName(
        processTableItem.processName
      ) as TProcessConstructor

      if (ProcessConstructor == null) {
        return console.warn("Can't find ProcessConstrutor:", processTableItem.processName)
      }

      const process = new ProcessConstructor(processTableItem)

      this.processTable[processTableItem.pid] = process
      this.queue.push(process)
    })
  }

  private static run(): void {
    this.killOrphanProcesses()

    this.wakeUpProcesses()

    // we should start with high priority processes
    this.sortQueueByPriority()

    while (this.queue) {
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
      .filter(process => process.parentProcess == null || process.parentProcess.isDead())
      .forEach(process => process.kill())
  }

  private static wakeUpProcesses(): void {
    this.queue.filter(process => process.isSleeping() && process.shouldWakeUp()).forEach(process => process.wakeUp())
  }

  private static sortQueueByPriority(): void {
    this.queue.sort((p1, p2) => p2.priority - p1.priority)
  }

  private static raisePriorityOfUnrunnedProcesses(): void {
    this.queue.forEach(process => (process.priority += 1))
  }

  private static save() {
    // exclude terminated
  }

  public static getProcessByPID(pid: number): Process {
    return this.processTable[pid]
  }
}
