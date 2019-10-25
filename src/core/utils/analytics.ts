import * as _ from 'lodash'

declare global {
  interface Memory {
    analytics: any
  }
}

export class Analytics {
  public static reset() {
    Memory.analytics = {
      rooms: {},
      time: Game.time,
      totalCreepCount: _.size(Game.creeps),
      actions: {}
    }
  }

  public static registerActionUsedCPU(actionName: string, usedCPU: number) {
    const actionsRecords = Memory.analytics.actions

    if (actionsRecords[actionName] == null) {
      actionsRecords[actionName] = {
        runTimes: 0,
        cpuUsed: []
      }
    }

    const actionRecords = actionsRecords[actionName]

    actionRecords.runTimes++
    actionRecords.cpuUsed.push(usedCPU)
  }

  public static record() {
    // Collect room stats
    for (const roomName in Game.rooms) {
      const room: Room = Game.rooms[roomName]
      const isMyRoom: boolean = (room.controller ? room.controller.my : false)

      if (isMyRoom) {
        const roomStats: any = Memory.analytics.rooms[roomName] = {}
        roomStats.storageEnergy = (room.storage ? room.storage.store.energy : 0)
        roomStats.terminalEnergy = (room.terminal ? room.terminal.store.energy : 0)
        roomStats.energyAvailable = room.energyAvailable
        roomStats.energyCapacityAvailable = room.energyCapacityAvailable
        roomStats.controllerProgress = room.controller!.progress
        roomStats.controllerProgressTotal = room.controller!.progressTotal
        roomStats.controllerLevel = room.controller!.level
      }
    }

    const actionsRecords = Memory.analytics.actions

    for (const actionName in actionsRecords) {
      const action = actionsRecords[actionName]

      action.cpuUsed = action.cpuUsed.length ? _.sum(action.cpuUsed) / action.cpuUsed.length : 0
    }

    // Collect GCL Analytics
    Memory.analytics.gcl = {
      progress: Game.gcl.progress,
      progressTotal: Game.gcl.progressTotal,
      level: Game.gcl.level
    }

    // Collect Memory analytics
    Memory.analytics.memory = {
      used: RawMemory.get().length
    }

    // Collect CPU analytics
    Memory.analytics.cpu = {
      bucket: Game.cpu.bucket,
      limit: Game.cpu.limit,
      used: Game.cpu.getUsed()
    }
  }
}
