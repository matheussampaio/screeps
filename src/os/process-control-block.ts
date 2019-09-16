import { PRIORITY, PROCESS_STATE } from './constants'

export interface ISerializedProcessControlBlock {
  processName: string
  parentPID: number
  programCounter: string
  PID: number
  processState: PROCESS_STATE
  priority: number
}

export interface IProcessControlBlockConstructorParams {
  memory?: any
  parentPID: number
  programCounter?: string
  PID?: number
  processState?: PROCESS_STATE
  priority?: number
}

export class ProcessControlBlock {
  public memory: any
  public processState: PROCESS_STATE
  public programCounter: string
  public priority: number
  public parentPID: number
  public PID: number

  constructor({
    parentPID,
    memory = {},
    programCounter = 'run',
    PID = -1,
    processState = PROCESS_STATE.READY,
    priority = PRIORITY.NORMAL
  }: IProcessControlBlockConstructorParams) {
    this.memory = memory
    this.parentPID = parentPID
    this.PID = PID
    this.processState = processState
    this.programCounter = programCounter
    this.priority = priority
  }

  public static unserialize(serializedPCB: ISerializedProcessControlBlock): ProcessControlBlock {
    return new ProcessControlBlock(serializedPCB)
  }

  public static serialize(processName: string, pcb: ProcessControlBlock): ISerializedProcessControlBlock {
    return {
      processName,

      PID: pcb.PID,
      parentPID: pcb.parentPID,
      priority: pcb.priority,
      processState: pcb.processState,
      programCounter: pcb.programCounter
    }
  }
}
