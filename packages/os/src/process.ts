import _ from 'lodash'

import { CODES, PRIORITY, PROCESS_STATE } from './constants'
import { Kernel } from './kernel'
import {
  IProcessControlBlockConstructorParams,
  ISerializedProcessControlBlock,
  ProcessControlBlock
} from './process-control-block'

export type TProcessConstructor = new (kernel: Kernel, pcb: ProcessControlBlock) => Process

export abstract class Process {
  public readonly kernel: Kernel
  public readonly pcb: ProcessControlBlock

  constructor(kernel: Kernel, pcb: ProcessControlBlock) {
    this.kernel = kernel
    this.pcb = pcb
  }

  public fork(ProcessContructor: TProcessConstructor, params: IProcessControlBlockConstructorParams) {
    params.parentPID = this.pcb.parentPID
    params.PID = this.kernel.getNextPID()
    params.memory = _.merge(
      this.kernel.getProcessMemory(params.PID),
      params.memory
    )

    const pcb = new ProcessControlBlock(params)
    const process = new ProcessContructor(this.kernel, pcb)

    this.kernel.addProcess(process)

    this.children.push(process.pcb.PID)
  }

  public get children(): number[] {
    this.pcb.memory.children = this.pcb.memory.children || []

    return this.pcb.memory.children
  }

  public get parentProcess() {
    return this.kernel.getProcessByPID(this.pcb.parentPID)
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

  public sleep(ticks: number = 1) {
    this.pcb.memory.wakeAt = Game.time + ticks
    this.pcb.processState = PROCESS_STATE.SLEEPING
  }

  public wakeUp(): void {
    delete this.pcb.memory.wakeAt

    this.pcb.processState = PROCESS_STATE.READY
  }

  public kill(): void {
    this.pcb.processState = PROCESS_STATE.DEAD

    // TODO: kill children
  }

  public abstract run(): void

  public serialize(): ISerializedProcessControlBlock {
    return ProcessControlBlock.serialize(this.constructor.name, this.pcb)
  }
}
