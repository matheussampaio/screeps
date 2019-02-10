import { CODES, PRIORITY, PROCESS_STATE } from "./constants";
import { Kernel } from "./kernel";
import { ProcessControlBlock } from "./process-control-block";

export interface IProcessConstructorParams {
  memory: any;
  parentProcessId: number;
  programCounter: string;
  processId: number;
  processState: PROCESS_STATE;
  priority: number;
}

export type TProcessConstructor = new (
  params: IProcessConstructorParams
) => Process;

export class Process {
  private readonly memory: any;
  private processState: PROCESS_STATE;
  private programCounter: string;
  public priority: number;
  public readonly parentProcessId: number;
  public readonly processId: number;

  constructor({
    memory,
    parentProcessId,
    programCounter = "run",
    processId = -1,
    processState = PROCESS_STATE.ALIVE,
    priority = PRIORITY.NORMAL
  }: IProcessConstructorParams) {
    if (this.memory == null) {
      throw new Error("Undefined memory received");
    }

    this.memory = memory;
    this.parentProcessId = parentProcessId;
    this.processId = processId;
    this.processState = processState;
    this.programCounter = programCounter;
    this.priority = priority;
  }

  public get parentProcess() {
    return Kernel.getProcessByPID(this.parentProcessId);
  }

  public isDead(): boolean {
    return this.processState === PROCESS_STATE.DEAD;
  }

  public isReady(): boolean {
    return this.processState === PROCESS_STATE.READY;
  }

  public isWaiting(): boolean {
    return this.processState === PROCESS_STATE.WAITING;
  }

  public isRunning(): boolean {
    return this.processState === PROCESS_STATE.RUNNING;
  }

  public isSleeping(): boolean {
    return this.processState === PROCESS_STATE.SLEEPING;
  }

  public shouldWakeUp(): boolean {
    return this.memory.wakeAt == null || this.memory.wakeAt <= Game.time;
  }

  public wakeUp(): void {
    delete this.memory.wakeAt;

    this.processState = PROCESS_STATE.READY;
  }

  public kill(): void {
    this.processState = PROCESS_STATE.DEAD;

    // TODO: kill children
  }

  public run(): void {
    console.log("Running!", this.constructor.name);
  }
}
