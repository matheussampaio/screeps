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
  minimumEnergy: number
  priority: number
  actions: string[][]
  memory: any
}

export interface ICityContext {
  roomName: string
  queue: ISpawnerItem[]
}
