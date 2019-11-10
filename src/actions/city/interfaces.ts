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
  linkPos: {
    x: number
    y: number
  } | null
  containerPos: {
    x: number
    y: number
  } | null
}

export interface ICityContext {
  roomName?: string
  queue?: ISpawnerItem[]
  emergencyCreep?: string
  linkCreep?: string
  planner?: Partial<{
    mineralLinkPos: {
      x: number
      y: number
    }
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
