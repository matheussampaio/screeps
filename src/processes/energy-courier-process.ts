import { RegisterProcess } from '../decorators'
import { Kernel, Process } from '../kernel'
import { CODES, MISSIONS, PRIORITY } from '../utils'

import { RoomControlProcess } from './room-control-process'

@RegisterProcess
export class EnergyCourierProcess extends Process {
    public run(): CODES {
        const room: Room = Game.rooms[this.memory.roomName]

        _.keys(this.memory.creeps).forEach((creepName) => {
            if (Game.creeps[creepName] == null) {
                delete Game.creeps[creepName]
            }
        })

        const creeps = _.keys(this.memory.creeps).map((name) => Game.creeps[name])

        if (creeps.length < 2) {
            const rcp = Kernel.getProcessByPID(this.parentPID) as RoomControlProcess

            rcp.SpawnProcess.add({
                body: [MOVE, CARRY, MOVE, CARRY],
                memory: {
                    mission: MISSIONS.FIND_ENERGY_TARGET
                },
                parentPID: this.pid,
                priority: creeps.length === 0 ? PRIORITY.HIGH : PRIORITY.NORMAL,
                role: 'EC'
            })
        }

        creeps.forEach((creep: Creep) => {
            if (creep.memory.mission === MISSIONS.FIND_ENERGY_TARGET) {
                creep.say('🔍: ⚡️')
                const sources = room.find(FIND_DROPPED_RESOURCES)

                if (sources.length) {
                    creep.memory.target = _.sample(sources).id
                    creep.memory.mission = MISSIONS.MOVE_TO_ENERGY_TARGET
                }
            } else if (creep.memory.mission === MISSIONS.MOVE_TO_ENERGY_TARGET) {
                creep.say('🚶: ⚡️')
                creep.mMoveTo(Game.getObjectById(creep.memory.target), { next: MISSIONS.COLLECT_ENERGY })

            } else if (creep.memory.mission === MISSIONS.COLLECT_ENERGY) {
                creep.say('⛏: ⚡️')

                const result = creep.pickup(Game.getObjectById(creep.memory.target))

                switch (result) {
                    case OK:
                    case ERR_FULL:
                        creep.memory.mission = MISSIONS.FIND_TRANSFER_TARGET
                        break
                    case ERR_NOT_OWNER:
                    case ERR_INVALID_TARGET:
                    case ERR_NOT_IN_RANGE:
                        creep.memory.mission = MISSIONS.FIND_ENERGY_TARGET
                        break
                }

            } else if (creep.memory.mission === MISSIONS.FIND_TRANSFER_TARGET) {
                creep.say('🔍: 🚧')

                const spawns = _.filter(Game.spawns, (s) => s.energy < s.energyCapacity && s.room.name === room.name)

                if (spawns && spawns.length) {
                    creep.memory.target = _.sample(spawns).id
                    creep.memory.mission = MISSIONS.MOVE_TO_TRANSFER_TARGET
                }

            } else if (creep.memory.mission === MISSIONS.MOVE_TO_TRANSFER_TARGET) {
                creep.say('🚶: 🚧')
                creep.mMoveTo(Game.getObjectById(creep.memory.target), { next: MISSIONS.TRANSFER_ENERGY })

            } else if (creep.memory.mission === MISSIONS.TRANSFER_ENERGY) {
                creep.say('⛽️: 🚧')

                const result = creep.transfer(Game.getObjectById(creep.memory.target), RESOURCE_ENERGY)

                switch (result) {
                    case OK:
                        creep.memory.mission = MISSIONS.FIND_ENERGY_TARGET
                        break
                    case ERR_INVALID_TARGET:
                    case ERR_FULL:
                    case ERR_NOT_IN_RANGE:
                    case ERR_NOT_OWNER:
                        creep.memory.mission = MISSIONS.FIND_TRANSFER_TARGET
                        break
                }

            } else {
                creep.memory.mission = MISSIONS.FIND_ENERGY_TARGET
            }
        })

        return CODES.OK
    }

    public receiveCreep(creepName: string) {
        this.memory.creeps = this.memory.creeps || {}

        this.memory.creeps[creepName] = true
    }
}
