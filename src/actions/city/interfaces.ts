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
  harvester: string | null
  hauler: string | null
  distance: number
}

export interface ICityContext extends ISleepContext {
  roomName: string
  queue: ISpawnerItem[]
  plan: {
    sources: IPlanSource[]
  }
}
