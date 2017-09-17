import { Agent } from '../../agent'
import { IAction } from '../../interfaces'
import { CreepRoles } from '../../roles'
import { getBody } from '../../utils'
import { CreateCreep } from './create-creep'

export const RoomController: IAction = {
    name: 'room-controller',
    run(room: Room) {
        // _.defaults(room.memory, {
        //     request: []
        // })

        // const creeps = _.chain(Game.creeps)
        //                 .filter((creep: Creep) => creep.my && creep.memory.role && creep.memory.room === room.name)
        //                 .groupBy((creep: Creep) => creep.memory.role)
        //                 .value()

        // room.memory.creeps = creeps

        // for (const roleName of CreepRoles) {
        //     const role = CreepRoles.get(roleName)

        //     if (role == null) {
        //         continue
        //     }

        //     if (role.process != null) {
        //         const creepRequest: any = role.process(room, creeps[roleName], true)

        //         if (creepRequest != null) {
        //             room.memory.request.push(creepRequest)
        //             return [Actions.SHIFT_UNSHIFT_AND_CONTINUE, CreateCreep.name]
        //         }
        //     } else if (creeps[roleName] == null || creeps[roleName].length < role.critical) {
        //         room.memory.request.push({
        //             body: [300, 'CMWCM'],
        //             role: roleName
        //         })

        //         return [Actions.SHIFT_UNSHIFT_AND_CONTINUE, CreateCreep.name]
        //     }
        // }

        // for (const roleName of CreepRoles) {
        //     const role = CreepRoles.get(roleName)

        //     if (role == null) {
        //         continue
        //     }

        //     if (role.process != null) {
        //         const creepRequest: any = role.process(room, creeps[roleName])

        //         if (creepRequest != null) {
        //             room.memory.request.push(creepRequest)
        //             return [Actions.SHIFT_UNSHIFT_AND_CONTINUE, CreateCreep.name]
        //         }
        //     } else if (creeps[roleName] == null || creeps[roleName].length < role.maximum) {
        //         room.memory.request.push({
        //             body: getBody(room),
        //             role: roleName
        //         })

        //         return [Actions.SHIFT_UNSHIFT_AND_CONTINUE, CreateCreep.name]
        //     }
        // }

        return Agent.WAIT_NEXT_TICK
    }
}
