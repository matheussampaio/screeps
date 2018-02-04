import { CreepRole } from '../model'

export class CreepRoleRegistry {
    private static readonly registry: { [s: string]: CreepRole } = {}

    public static register(constructor: any): void {
        CreepRoleRegistry.registry[constructor.name] = new constructor()
    }

    public static fetch(name: string): CreepRole {
        return CreepRoleRegistry.registry[name]
    }
}
