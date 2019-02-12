import { CODES, PRIORITY, PROCESS_STATE } from './constants'
import { Kernel } from './kernel'
import {
  IProcessControlBlockConstructorParams,
  ISerializedProcessControlBlock,
  ProcessControlBlock
} from './process-control-block'

export type TProcessConstructor = new (pcb: ProcessControlBlock) => Process

export class Process {
  public fork(ProcessContructor: TProcessConstructor, params: IProcessControlBlockConstructorParams) {
    params.parentPID = this.pcb.parentPID

    const pcb = new ProcessControlBlock(params)
    const process = new ProcessContructor(pcb)

    Kernel.queueProcess(process)

    this.children.push(process.pcb.PID)
  }

  constructor(public readonly pcb: ProcessControlBlock) {}

  public get children(): number[] {
    this.pcb.memory.children = this.pcb.memory.children || []

    return this.pcb.memory.children
  }

  public get parentProcess() {
    return Kernel.getProcessByPID(this.pcb.parentPID)
  }

  public isDead(): boolean {
    return this.pcb.processState === PROCESS_STATE.DEAD
  }

  public isAlive(): boolean {
    return this.pcb.processState !== PROCESS_STATE.DEAD
  }

  public isReady(): boolean {
    return this.pcb.processState === PROCESS_STATE.READY
  }

  public isWaiting(): boolean {
    return this.pcb.processState === PROCESS_STATE.WAITING
  }

  public isRunning(): boolean {
    return this.pcb.processState === PROCESS_STATE.RUNNING
  }

  public isSleeping(): boolean {
    return this.pcb.processState === PROCESS_STATE.SLEEPING
  }

  public shouldWakeUp(): boolean {
    return this.pcb.memory.wakeAt == null || this.pcb.memory.wakeAt <= Game.time
  }

  public wakeUp(): void {
    delete this.pcb.memory.wakeAt

    this.pcb.processState = PROCESS_STATE.READY
  }

  public kill(): void {
    this.pcb.processState = PROCESS_STATE.DEAD

    // TODO: kill children
  }

  public run(): void {
    console.log('Running!', this.constructor.name)
  }

  public serialize(): ISerializedProcessControlBlock {
    return ProcessControlBlock.serialize(this.constructor.name, this.pcb)
  }
}
