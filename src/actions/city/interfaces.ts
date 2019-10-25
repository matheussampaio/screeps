import { ISleepContext } from '../sleep'

declare global {
  interface Memory {
    counters?: {
      creepCounter?: number
    }
  }

  interface RoomMemory {
    PID: number
  }
}

export interface ISpawnerItem {
  body: BodyPartConstant[]
  priority: number
  actions: string[][]
  memory: any
  creepName?: string
}

export interface IPlanSource {
  id: string
  harvesters: string[]
  haulers: string[]
  distance: number
  emptySpaces: number
  desiredWorkParts: number
  desiredCarryParts: number
  containerPos: {
    x: number
    y: number
  } | null
}

export interface ICityContext extends ISleepContext {
  roomName: string
  queue: ISpawnerItem[]
  emergencyCreep: string
  plan: {
    time: number
    rcl: number
    energyCapacity: number
    sources: IPlanSource[]
    builders: string[]
    upgraders: string[]
    storagers: string[]
    upgradersBody: BodyPartConstant[]
  }
}
