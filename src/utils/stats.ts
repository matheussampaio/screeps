let stats: any = {}

export class Stats {
    public static init() {
        stats = {
            cpu: {},
            gcl: {},
            memory: {},
            roomSummary: {},
            times: {
                roles: {},
                actions: {}
            },
            time: Game.time,
            totalCreepCount: _.size(Game.creeps),
            rooms: _.keys(Game.rooms)
        }
    }

    static get times() {
        return stats.times
    }

    public static collect() {
        if (Game.rooms.sim != null) {
            return
        }

        // Collect room stats
        for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName]
            const isMyRoom = (room.controller ? room.controller.my : false)

            if (isMyRoom) {
                const roomStats: any = stats.roomSummary[roomName] = {}

                roomStats.storageEnergy = (room.storage ? room.storage.store.energy : 0)
                roomStats.terminalEnergy = (room.terminal ? room.terminal.store.energy : 0)
                roomStats.energyAvailable = room.energyAvailable
                roomStats.energyCapacityAvailable = room.energyCapacityAvailable
                roomStats.controllerProgress = room.controller!.progress
                roomStats.controllerProgressTotal = room.controller!.progressTotal
                roomStats.controllerLevel = room.controller!.level

                const lastProgress = _.get(Memory, `stats.roomSummary.${roomName}.controllerProgress`, roomStats.controllerProgress)

                roomStats.controllerDiff = roomStats.controllerProgress - lastProgress
            }
        }

        // Collect GCL stats
       stats.gcl.progress = Game.gcl.progress
       stats.gcl.progressTotal = Game.gcl.progressTotal
       stats.gcl.level = Game.gcl.level

        // Collect Memory stats
       stats.memory.used = RawMemory.get().length

        // Collect CPU stats
       stats.cpu.bucket = Game.cpu.bucket
       stats.cpu.limit = Game.cpu.limit
       stats.cpu.used = Game.cpu.getUsed()
       stats.cpu.tickLimit = Game.cpu.tickLimit

       Memory.stats = stats
    }
}
