import _ from 'lodash'
import { PRIORITY, PROCESS_STATE } from './constants'
import { Kernel } from './kernel'
import { Process } from './process'

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
  public readonly memory: any
  public processState: PROCESS_STATE
  public programCounter: string
  public priority: number
  public readonly parentPID: number
  public readonly PID: number

  constructor({
    parentPID,
    memory = {},
    programCounter = 'run',
    PID = Kernel.getNextPID(),
    processState = PROCESS_STATE.READY,
    priority = PRIORITY.NORMAL
  }: IProcessControlBlockConstructorParams) {
    this.memory = _.merge(Kernel.getProcessMemory(PID), memory)
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
