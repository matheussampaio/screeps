import { PRIORITY, PROCESS_STATE } from './constants'
import { Process } from './process'

export interface ISerializedProcessControlBlock {
  processName: string
  parentProcessId: number
  programCounter: string
  processId: number
  processState: PROCESS_STATE
  priority: PRIORITY
  memory: any
}

export interface IProcessControlBlockConstructorParams {
  memory: any
  parentProcessId: number
  programCounter: string
  processId: number
  processState: PROCESS_STATE
  priority: number
}

export class ProcessControlBlock {
  public readonly memory: any
  public processState: PROCESS_STATE
  public programCounter: string
  public priority: number
  public readonly parentProcessId: number
  public readonly processId: number

  constructor({
    memory,
    parentProcessId,
    programCounter = 'run',
    processId = -1,
    processState = PROCESS_STATE.READY,
    priority = PRIORITY.NORMAL
  }: IProcessControlBlockConstructorParams) {
    if (this.memory == null) {
      throw new Error('Undefined memory received')
    }

    this.memory = memory
    this.parentProcessId = parentProcessId
    this.processId = processId
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

      memory: pcb.memory,
      parentProcessId: pcb.parentProcessId,
      priority: pcb.priority,
      processId: pcb.processId,
      processState: pcb.processState,
      programCounter: pcb.programCounter
    }
  }
}
