import { version } from '../package.json'
import '../Traveler/Traveler'
import * as Actions from './actions'
import { ActionsRegistry, Agent } from './agent'
import { IAction, ICreepRole, IRoomRole } from './interfaces'
import { install } from './prototypes'
import { CreepRoles, RoomRoles } from './roles'
import { Stats } from './utils'

_.values(Actions).forEach((action: IAction) => ActionsRegistry.register(action))

install()

console.log(version)

export function loop() {
    console.log(`#${Game.time}`)

    Stats.init()

    // GC creeps
    for (const creepName in Memory.creeps) {
        if (Game.creeps[creepName] == null) {
            delete Memory.creeps[creepName]
        }
    }

    for (const creepName in Game.creeps) {
        const creep: Creep = Game.creeps[creepName]

        if (creep.spawning) {
            continue
        }

        const role: ICreepRole | null = CreepRoles.get(creep.memory.role)

        const startCPU = Game.cpu.getUsed()

        if (role != null) {
            Agent.run(creep, role.defaults)
        } else {
            Agent.run(creep, [])
        }

        const spent = Game.cpu.getUsed() - startCPU

        const roleName = creep.memory.role || 'blank'

        if (Stats.times.roles[roleName] == null) {
            Stats.times.roles[roleName] = { totalCPU: spent, count: 1 }
        } else {
            Stats.times.roles[roleName].totalCPU += spent
            Stats.times.roles[roleName].count += 1
        }

        const average = Stats.times.roles[roleName].totalCPU / Stats.times.roles[roleName].count
        Stats.times.roles[roleName].average = average
    }

    // GC rooms
    for (const roomName in Memory.creeps) {
        if (Game.rooms[roomName] == null && Memory.rooms != null) {
            Memory.rooms[roomName] = undefined
        }
    }

    for (const roomName in Game.rooms) {
        const room: Room = Game.rooms[roomName]

        const role: IRoomRole | null = RoomRoles.get('default')

        if (role != null) {
            Agent.run(room, role.defaults)
        }
    }

    Stats.collect()
}
