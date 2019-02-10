import { PRIORITY, PROCESS_STATE } from "./constants";
import { Process } from "./process";

export interface IProcessControlBlockConstructor {
  accountingInformation: any;
  memoryInformation: any;
  parentProcessId: number;
  processId: number;
  processState: PROCESS_STATE;
  programCounter: string;
  schedulingInformation: PRIORITY;
}

export class ProcessControlBlock {
  constructor(pcb: IProcessControlBlock) {

  }

  static public unserialize(serializedPCB) {
    return new ProcessControlBlock(...serializedPCB)
  }

  static public serialize(pcb: ProcessControlBlock) {

  }
}
