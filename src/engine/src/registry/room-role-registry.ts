import { RoomRole } from '../model'

export class RoomRoleRegistry {
    private static readonly registry: { [s: string]: RoomRole } = {}

    public static register(constructor: any): void {
        RoomRoleRegistry.registry[constructor.name] = new constructor()
    }

    public static fetch(name: string): RoomRole {
        return RoomRoleRegistry.registry[name]
    }
}
