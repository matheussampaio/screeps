import { registerProcess } from '../../decorators/registerProcess'
import { Kernel } from '../../kernel'
import { Process } from '../../kernel/process'

@registerProcess
export class SHUCreep extends Process {
    public static touch() {
        // don't read this
    }

    public run() {
        this.creep = Game.creeps[this.memory.creepName]
        this.room = Game.rooms[this.memory.roomName]
        this.spawn = _.find(Game.spawns, (s) => s.energy < s.energyCapacity && s.room.name === this.room.name)

        if (this.room == null || this.creep == null) {
            return Kernel.killProcess(this.pid)
        }

        this.memory.mission = this.memory.mission || 'energy'

        // console.log(this.memory.mission, this.creep.name)

        if (this.memory.mission === 'energy') {
            if (this.creep.carry.energy < this.creep.carryCapacity) {
                this.getEnergy()
            } else {
                this.memory.mission = 'transfer'
            }
        } else if (this.memory.mission === 'transfer') {
            if (this.spawn != null) {
                this.fillSpawn()
            } else {
                this.memory.mission = 'upgrade'
            }
        } else if (this.memory.mission === 'upgrade') {
            if (this.creep.carry.energy) {
                this.upgradeController()
            } else {
                this.memory.mission = 'energy'
            }
        }
    }

    private getEnergy() {
        let target = Game.getObjectById(this.memory.target)

        if (target == null) {
            const sources = this.room.find(FIND_SOURCES_ACTIVE)

            if (sources.length) {
                this.memory.target = _.sample(sources).id
            }

            target = Game.getObjectById(this.memory.target)
        }

        if (target != null) {
            const codeHarvest = this.creep.harvest(target)
            if (codeHarvest === ERR_NOT_IN_RANGE && this.creep.fatigue === 0) {
                const codeMove = this.creep.moveTo(target)
                if (codeMove !== OK) {
                    this.memory.target = null
                }
            }
        }
    }

    private fillSpawn() {
        const codeTransfer = this.creep.transfer(this.spawn, RESOURCE_ENERGY)

        if (codeTransfer === OK) {
            this.memory.mission = 'energy'
        } else if (codeTransfer === ERR_NOT_IN_RANGE) {
            const codeMove = this.creep.moveTo(this.spawn)
        }
    }

    private upgradeController() {
        if (this.creep.upgradeController(this.room.controller) === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(this.room.controller)
        }
    }
}
