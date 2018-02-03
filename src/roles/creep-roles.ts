import {
    Builder,
    Courier,
    DieInPeace,
    HarvesterEnergy,
    Hauler,
    Upgrader,
    WithdrawFromLink } from '../actions'
import { ICreepRole } from '../interfaces'

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
            next: () => ({
                // tslint:disable-next-line:no-increment-decrement
                value: keys[i++],
                done: i > keys.length
            })
        }
    }
}
