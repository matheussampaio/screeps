import { Agent } from '../../../agent'
import { Builder } from '../builder'
import { IAction } from '../../../interfaces'
import { GetEnergyFromStorage } from '../commons'

export const Courier: IAction = {
    name: 'courier',
    run(creep: Creep) {
        if (creep.carry.energy === 0) {
            return [Agent.UNSHIFT_AND_CONTINUE, GetEnergyFromStorage.name]
        }

        let target: StructureSpawn | StructureExtension = Game.getObjectById(creep.memory.target)

        if (target == null || target.energy === target.energyCapacity) {
            delete creep.memory.target

            const towers = creep.room.find(FIND_MY_STRUCTURES, {
                filter: (s: StructureTower) => s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity - 250
            })
            .sort((a: StructureTower, b: StructureTower) => a.energy - b.energy)

            if (towers.length) {
                target = towers[0]
                creep.memory.target = target.id
            }

            if (target == null) {
                target = creep.getTarget(FIND_MY_STRUCTURES, {
                    filter: (s: StructureExtension) => (s.structureType === STRUCTURE_EXTENSION || s.structureType === STRUCTURE_SPAWN) && !s.isFull()
                })
            }

            if (target == null && creep.room.terminal && !creep.room.terminal.isFull()) {
                target = creep.room.terminal
                creep.memory.target = creep.room.terminal.id
            }

            if (target == null) {
                return Agent.SHIFT_AND_STOP
            } else {
                creep.memory.target = target.id
            }
        }

        const result = creep.transfer(target, RESOURCE_ENERGY)

        if (result === OK) {
            delete creep.memory.target
            return Agent.SHIFT_AND_STOP
        }

        if (result === ERR_NOT_IN_RANGE) {
            creep.travelTo(target)
        }

        if (result === ERR_INVALID_TARGET) {
            delete creep.memory.target
        }

        if (result === ERR_FULL) {
            delete creep.memory.target
        }

        return Agent.SHIFT_AND_STOP
    }
}

export const WithdrawFromLink: IAction = {
    name: 'withdraw-from-link',
    run(creep: Creep) {
        const linkId = _.get(creep, `room.memory.links.storage`)

        if (linkId == null) {
            console.log('linkId is null')
            return Agent.SHIFT_AND_CONTINUE
        }

        const link = Game.getObjectById(linkId)

        if (link.energy === 0) {
            return Agent.SHIFT_AND_CONTINUE
        }

        if (_.sum(creep.carry) === creep.carryCapacity) {
            const result = creep.transfer(creep.room.storage, RESOURCE_ENERGY)

            console.log('transfer to storage result', result)

            if (result === ERR_NOT_IN_RANGE) {
                console.log('travel to storage')
                creep.travelTo(creep.room.storage)
                return Agent.WAIT_NEXT_TICK
            }
        }

        const result = creep.withdraw(link, RESOURCE_ENERGY)

        if (result === ERR_NOT_IN_RANGE) {
            creep.travelTo(link)
            return Agent.WAIT_NEXT_TICK
        }

        return Agent.WAIT_NEXT_TICK
    }
}
