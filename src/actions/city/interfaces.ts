declare global {
  interface Memory {
    counters?: {
      creepCounter?: number
    }
    enemies: {
      [roomName: string]: {
        time: number
        attackPower: number
      }
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
  ticksToFulfill?: number
}

export interface IPlanSource {
  id: string
  harvesters: string[]
  haulers: string[]
  distance: number
  emptySpaces: number
  desiredWorkParts: number
  desiredCarryParts: number
  roomName?: string
  linkPos: {
    x: number
    y: number
  } | null
  containerPos: {
    x: number
    y: number
  } | null
}

export interface IPlanMineral {
  id: string
  harvesters: string[]
  haulers: string[]
  repairs: string[]
  distance: number
  emptySpaces: number
  desiredCarryParts: number
  containerPos: {
    x: number
    y: number
  } | null
}

export interface ICityContext {
  roomName?: string
  queue?: ISpawnerItem[]
  emergencyCreep?: string
  recyclerCreep?: string
  linkCreep?: string
  scoutRoom?: string
  scoutCreep?: string
  guard?: string
  remotes: {
    [roomName: string]: {
      sources: {
        [sourceId: string]: IPlanSource
      }
      reserver: string
    }
  }
  planner?: Partial<{
    storageLinkPos: {
      x: number
      y: number
    }
    center: {
      x: number
      y: number
    }
    energyCapacityAvailable: number
    rcl: number
    time: number
    sources: {
      [sourceId: string]: IPlanSource
    }
    minerals: {
      [mineralId: string]: IPlanMineral
    }
    builders: string[]
    upgraders: string[]
    storagers: string[]
    upgradersBody: BodyPartConstant[]
    map: BuildableStructureConstant[][]
    nextPrune: number
    nextConstruction: number
    plannedAt: number
  }>
}
