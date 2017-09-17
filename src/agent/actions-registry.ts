import { IAction } from '../interfaces'

const _actions: { [actionName: string]: IAction } = {}

export class ActionsRegistry {
    public static register(action: IAction) {
        _actions[action.name] = action
    }

    public static fetch(name: string): IAction {
        return _actions[name]
    }
}
