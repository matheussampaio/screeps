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
  container: string | null
}

export interface ICityContext extends ISleepContext {
  roomName: string
  queue: ISpawnerItem[]
  plan: {
    energyCapacity: number
    sources: IPlanSource[]
  }
}
