export interface ICreepContext {
  creepName: string
  action?: string
  source?: string
  target?: string
  rangeToController: number
  spawn?: string
}

declare global {
  interface CreepMemory {
    PID: number
    roomName: string
    replacementOnTheWay?: boolean
    renew?: boolean
    avoidMoving?: boolean
  }

  interface Memory {
    enemies: {
      [roomName: string]: number
    }
  }
}
