import { RegisterProcess } from '../decorators'
import { Kernel, Process } from '../kernel'
import { CODES, MISSIONS, PRIORITY } from '../utils'

import { RoomControlProcess } from './room-control-process'

@RegisterProcess
export class ControllerUpgraderProcess extends Process {
    public run(): CODES {
        const room: Room = Game.rooms[this.memory.roomName]

        _.keys(this.memory.creeps).forEach((creepName) => {
            if (Game.creeps[creepName] == null) {
                delete this.memory.creeps[creepName]
            }
        })

        const creeps = _.keys(this.memory.creeps).map((name) => Game.creeps[name])

        if (creeps.length < 2) {
            const rcp = Kernel.getProcessByPID(this.parentPID) as RoomControlProcess

            rcp.SpawnProcess.add({
                body: [MOVE, CARRY, WORK, MOVE, CARRY],
                memory: {
                    mission: MISSIONS.FIND_ENERGY_TARGET
                },
                parentPID: this.pid,
                priority: PRIORITY.NORMAL,
                role: 'CU'
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
            }

            if (creep.memory.mission === MISSIONS.MOVE_TO_ENERGY_TARGET) {
                creep.say('🚶: ⚡️')
                creep.mMoveTo(Game.getObjectById(creep.memory.target), { next: MISSIONS.COLLECT_ENERGY })
            }

            if (creep.memory.mission === MISSIONS.COLLECT_ENERGY) {
               creep.say('⛏: ⚡️')

               const result = creep.pickup(Game.getObjectById(creep.memory.target))

               switch (result) {
                   case OK:
                   case ERR_FULL:
                       creep.memory.mission = MISSIONS.MOVE_TO_CONTROLLER
                       break
                   case ERR_NOT_OWNER:
                   case ERR_INVALID_TARGET:
                   case ERR_NOT_IN_RANGE:
                       creep.memory.mission = MISSIONS.FIND_ENERGY_TARGET
                       break
               }
           }

            if (creep.memory.mission === MISSIONS.MOVE_TO_CONTROLLER) {
               creep.say('🚶: 🚧')
               creep.mMoveTo(room.controller, { next: MISSIONS.UPGRADE_CONTROLLER })
           }

            if (creep.memory.mission === MISSIONS.UPGRADE_CONTROLLER) {
                const result = creep.upgradeController(room.controller)

                switch (result) {
                    case OK:
                        creep.say('⚒: 🚧')
                        break
                    case ERR_NOT_ENOUGH_RESOURCES:
                        creep.memory.mission = MISSIONS.FIND_ENERGY_TARGET
                        break
                    case ERR_NOT_IN_RANGE:
                        creep.memory.mission = MISSIONS.MOVE_TO_CONTROLLER
                        break
                    default:
                        console.log(JSON.stringify(room.controller.my))
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
