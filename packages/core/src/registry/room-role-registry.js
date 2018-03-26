import { RoomRole } from '../model'

export class RoomRoleRegistry {
    static register(constructor) {
        RoomRoleRegistry.registry[constructor.name] = new constructor()
    }

    static fetch(name) {
        return RoomRoleRegistry.registry[name]
    }
}

RoomRoleRegistry.registry = {}
