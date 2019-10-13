export interface ICreepContext {
  creepName: string
  action?: string
  source?: string
  target?: string
}

declare global {
  interface CreepMemory {
    PID: number
    roomName: string
  }
}
