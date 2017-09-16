import { RegisterProcess } from '../decorators'
import { Kernel, Process } from '../kernel'
import { CODES, MISSIONS, PRIORITY } from '../utils'

import { RoomControlProcess } from './room-control-process'

@RegisterProcess
export class BuildersProcess extends Process {
    public run(): CODES {
        const room: Room = Game.rooms[this.memory.roomName]

        _.keys(this.memory.creeps).forEach((creepName) => {
            if (Game.creeps[creepName] == null) {
                delete this.memory.creeps[creepName]
            }
        })

        const constructions = room.find(FIND_CONSTRUCTION_SITES)

        if (constructions == null || constructions.length === 0) {
            return this.idle(50)
        }

        const creeps = _.keys(this.memory.creeps).map(name => Game.creeps[name])

        if (creeps.length < 2) {
            const rcp = Kernel.getProcessByPID(this.parentPID) as RoomControlProcess

            rcp.SpawnProcess.add({
                body: [MOVE, CARRY, WORK, MOVE, CARRY],
                memory: {
                    mission: MISSIONS.FIND_ENERGY_TARGET
                },
                parentPID: this.pid,
                priority: PRIORITY.NORMAL,
                role: 'B'
            })
        }

        creeps.forEach((creep: Creep) => {
            creep.memory.mission = creep.memory.mission || MISSIONS.FIND_ENERGY_TARGET

            console.log(creep.name, creep.memory.mission)
            if (creep.memory.mission === MISSIONS.FIND_ENERGY_TARGET) {
                const sources = room.find(FIND_DROPPED_RESOURCES)

                if (sources.length) {
                    creep.memory.target = _.sample(sources).id
                    creep.memory.mission = MISSIONS.MOVE_TO_ENERGY_TARGET
                }
            }

            if (creep.memory.mission === MISSIONS.MOVE_TO_ENERGY_TARGET) {
                const result  = creep.mMoveToTarget({ next: MISSIONS.COLLECT_ENERGY })

                if (result === ERR_INVALID_TARGET) {
                    creep.memory.mission = MISSIONS.FIND_ENERGY_TARGET
                }
            }

            if (creep.memory.mission === MISSIONS.COLLECT_ENERGY) {
                const result = creep.mPickupTarget()

                switch (result) {
                    case OK:
                    case ERR_FULL:
                        creep.memory.mission = MISSIONS.FIND_BUILD_TARGET
                        break
                    case ERR_NOT_OWNER:
                    case ERR_INVALID_TARGET:
                    case ERR_NOT_IN_RANGE:
                        creep.memory.mission = MISSIONS.FIND_ENERGY_TARGET
                    default:
                        break
                }
            }

            if (creep.memory.mission === MISSIONS.FIND_BUILD_TARGET) {
                if (creep.memory.target == null && constructions && constructions.length) {
                    creep.memory.target = _.sample(constructions).id
                }

                creep.memory.mission = MISSIONS.MOVE_TO_BUILD_TARGET
            }

            if (creep.memory.mission === MISSIONS.MOVE_TO_BUILD_TARGET) {
                const result = creep.mMoveToTarget({ next: MISSIONS.CONSTRUCT })

                if (result === ERR_INVALID_TARGET) {
                    creep.memory.mission = MISSIONS.FIND_BUILD_TARGET
                }
            }

            if (creep.memory.mission === MISSIONS.CONSTRUCT) {
                const result = creep.build(Game.getObjectById(creep.memory.target))

                switch (result) {
                    case OK:
                        creep.say('⚒')
                        break
                    case ERR_NOT_ENOUGH_RESOURCES:
                        creep.memory.mission = MISSIONS.FIND_ENERGY_TARGET
                        break
                    case ERR_NOT_IN_RANGE:
                        creep.memory.mission = MISSIONS.MOVE_TO_BUILD_TARGET
                        break
                    case ERR_INVALID_TARGET:
                        creep.memory.mission = MISSIONS.FIND_BUILD_TARGET
                        break
                    default:
                        creep.say(`⚠️ (⚒): ${result}`)
                        break
                }
            }
        })

        return CODES.OK
    }

    public receiveCreep(creepName: string) {
        this.memory.creeps = this.memory.creeps || {}

        this.memory.creeps[creepName] = true
    }
}
