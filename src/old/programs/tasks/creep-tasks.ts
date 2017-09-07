import { RCLProgram } from '../rcl'

export class CreepTasks {
    public static getCreepsNumber(rcl: RCLProgram) {
        rcl.memory.children.creeps = rcl.memory.children.creeps || (rcl.memory.children.creeps = {})

        rcl.creeps = {}

        for (const pid in rcl.memory.children.creeps) {
            const creep = rcl.memory.children.creeps[pid]

            if (rcl.creeps[creep.processName] == null) {
                rcl.creeps[creep.processName] = 0
            }

            rcl.creeps[creep.processName] += 1
        }

        return true
    }

    public static createSHUCreeps(rcl: RCLProgram, total: number = 10) {
        if (rcl.creeps.SHUCreep == null || rcl.creeps.SHUCreep < total) {
            rcl.spawn.add({
                body: [MOVE, WORK, MOVE, CARRY],
                memory: { roomName: rcl.memory.roomName },
                parentPID: rcl.pid,
                process: 'SHUCreep'
            })
        }

        return true
    }

    public static harvester(rcl) {
        // FIXME: we should have the number of sources on the global.Room.roomName
        if (rcl.creeps.HarvesterCreep == null || rcl.creeps.HarvesterCreep < 2) {
            rcl.spawn.add({
                body: [MOVE, WORK, MOVE, CARRY],
                memory: { roomName: rcl.memory.roomName },
                parentPID: rcl.pid,
                process: 'HarvesterCreep'
            })
        }

        return true
    }
}
