export interface IAction {
    name: string,
    run(agent: Creep | Room): string | string[]
}
