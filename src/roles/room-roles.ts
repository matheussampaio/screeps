import { IRoomRole } from '../interfaces'

import {
    Builder1, CreateCreep, Harvester1, RoomController, RoomDefenses,
    RoomPlanner, Upgrader1, DebugVisualizeRoom
} from '../actions'

const roles: { [key: string]: IRoomRole } = {
    default: {
        defaults: [
            [Harvester1.name],
            [Upgrader1.name],
            [Builder1.name],
            [RoomController.name],
            [RoomDefenses.name],
            [RoomPlanner.name],
            [CreateCreep.name],
        ]
    }
}

export const RoomRoles = {
    get(role: string): IRoomRole | null {
        return roles[role] || null
    }
}
