import * as _ from 'lodash'

declare global {
  interface Memory {
    analytics: {
      cpu?: {
        bucket: number
        limit: number
        used: number
      }
      gcl?: {
        progress: number
        progressTotal: number
        level: number
      }
      memory?: {
        used: number
      }
      rooms: {
        [roomName: string]: any
      }
      time: number
      totalCreepCount: number
    }
  }
}

export class Analytics {
  public static get memory() {
    _.defaults(Memory, {
      analytics: {}
    })

    return Memory.analytics
  }
}
