import { Builder, Courier, DieInPeace, HarvesterEnergy, Hauler, Upgrader, WithdrawFromLink } from '../actions'
import { ICreepRole } from '../interfaces'
import { getBody } from '../utils'

const roles: { [key: string]: ICreepRole } = {
    HarvesterEnergy: {
        defaults: [[HarvesterEnergy.name], [DieInPeace.name]],
    },
    Hauler: {
        defaults: [[Hauler.name], [DieInPeace.name]],
    },
    Upgrader: {
        defaults: [[Upgrader.name], [DieInPeace.name]],
    },
    Builder: {
        defaults: [[Builder.name], [DieInPeace.name]],
    },
    Courier: {
        defaults: [[WithdrawFromLink.name, Courier.name]]
    }
}

export const CreepRoles = {
    get(role: string): ICreepRole | null {
        return roles[role] || null
    },
    [Symbol.iterator]() {
        const keys = _.keys(roles)
        let i = 0

        return {
            next: () => ({ value: keys[i++], done: i > keys.length })
        }
    }
}
