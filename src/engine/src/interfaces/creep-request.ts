import { Priority } from '../util'

export interface CreepRequest {
    body: string,
    energyNeeded: number,
    memory: any,
    name?: string,
    priority: Priority
}
