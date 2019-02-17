import { Process } from './process'

export interface IAnalytics {
  processPreRun(process: Process): void
  processPostRun(process: Process): void
}

export class Analytics implements IAnalytics {
  public get memory() {
    Memory.analytics = Memory.analytics || {}

    return Memory.analytics
  }

  public processPreRun(process: Process) {
    // TODO: store cpu
  }

  public processPostRun(process: Process) {
    // TODO: calculate used cpu
  }
}
