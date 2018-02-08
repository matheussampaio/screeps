import { Action } from "../model"

export class ActionRegistry {
    private static readonly registry: { [s: string]: Action } = {}

    public static register(constructor: any): void {
        ActionRegistry.registry[constructor.name] = new constructor()
    }

    public static fetch(name: string): Action {
        return ActionRegistry.registry[name]
    }
}
