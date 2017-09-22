import { Agent } from '../../agent'
import { IAction } from '../../interfaces'
import { CreepRoles } from '../../roles'
import { getBody } from '../../utils'
import { CreateCreep } from './create-creep'

export const RoomController: IAction = {
    name: 'room-controller',
    run(room: Room) {
        return Agent.WAIT_NEXT_TICK
    }
}
