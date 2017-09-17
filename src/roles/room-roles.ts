import { IRoomRole } from '../interfaces'

import { CreateCreep, Harvester1, RoomController, RoomDefenses, RoomPlanner } from '../actions'

const roles: { [key: string]: IRoomRole } = {
    default: {
        defaults: [
            [Harvester1.name],
            [RoomController.name],
            [RoomDefenses.name],
            [RoomPlanner.name],
            [CreateCreep.name]
        ]
    }
}

export const RoomRoles = {
    get(role: string): IRoomRole | null {
        return roles[role] || null
    }
}
