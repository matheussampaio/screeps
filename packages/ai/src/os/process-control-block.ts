import { PRIORITY, PROCESS_STATE } from './constants'
import { Process } from './process'

export interface ISerializedProcessControlBlock {
  processName: string
  parentPID: number
  programCounter: string
  PID: number
  processState: PROCESS_STATE
  priority: number
  memory: any
}

export interface IProcessControlBlockConstructorParams {
  memory: any
  parentPID: number
  programCounter: string
  PID: number
  processState: PROCESS_STATE
  priority: number
}

export class ProcessControlBlock {
  public readonly memory: any
  public processState: PROCESS_STATE
  public programCounter: string
  public priority: number
  public readonly parentPID: number
  public readonly PID: number

  constructor({
    memory,
    parentPID,
    programCounter = 'run',
    PID = -1,
    processState = PROCESS_STATE.READY,
    priority = PRIORITY.NORMAL
  }: IProcessControlBlockConstructorParams) {
    if (this.memory == null) {
      throw new Error('Undefined memory received')
    }

    this.memory = memory
    this.parentPID = parentPID
    this.PID = PID
    this.processState = processState
    this.programCounter = programCounter
    this.priority = priority
  }

  public static unserialize(
    serializedPCB: ISerializedProcessControlBlock
  ): ProcessControlBlock {
    return new ProcessControlBlock(serializedPCB)
  }

  public static serialize(
    processName: string,
    pcb: ProcessControlBlock
  ): ISerializedProcessControlBlock {
    return {
      processName,

      PID: pcb.PID,
      memory: pcb.memory,
      parentPID: pcb.parentPID,
      priority: pcb.priority,
      processState: pcb.processState,
      programCounter: pcb.programCounter
    }
  }
}
