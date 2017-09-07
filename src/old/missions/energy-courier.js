import Mission from './mission';
import { createCreep, calculateBody } from '../utils/utils';

export default class EnergyCourier extends Mission {
    prerun() {
        const creepsEH = _.filter(Game.creeps, creep => (
            creep.room.name === this.flag.room.name && creep.memory.role === 'EH'
        ));

        this.creeps = createCreep({
            role: 'EC',
            room: this.flag.room,
            number: creepsEH.length,
            getBody: () => calculateBody({
                energyAvailable: this.flag.room.energyAvailable,
                carry: [1, Infinity],
                move: [1, Infinity]
            })
        });

        return this.creeps.length;
    }

    run() {
        this.creeps.forEach((creep) => {
            if (creep.carry.energy < creep.carryCapacity) {
                return this.getEnergy(creep);
            }

            return this.transferEnergy(creep);
        });
    }

    getEnergy(creep) {
        if (creep.memory.targetEnergy == null) {
            const sources = this.flag.room.find(FIND_DROPPED_RESOURCES);

            if (sources.length) {
                creep.memory.targetEnergy = _.sample(sources).id;
            }
        }

        const target = Game.getObjectById(creep.memory.targetEnergy);

        if (target == null) {
            creep.memory.targetEnergy = null;
        }

        if (creep.memory.targetEnergy && creep.pickup(target) === ERR_NOT_IN_RANGE) {
            if (creep.moveTo(target) !== OK) {
                creep.memory.targetEnergy = null;
            }
        }
    }

    transferEnergy(creep) {
        if (creep.memory.targetTransfer == null) {
            const targets = creep.room.find(FIND_MY_STRUCTURES, {
                filter: s => [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER].includes(s.structureType)
                            && s.energy < s.energyCapacity
            });

            if (targets.length) {
                creep.memory.targetTransfer = _.sample(targets).id;
            }
        }

        const target = Game.getObjectById(creep.memory.targetTransfer);

        if (target == null) {
            creep.memory.targetTransfer = null;
        }

        if (creep.memory.targetTransfer) {
            const code = creep.transfer(target, RESOURCE_ENERGY);

            if (code !== OK) {
                if (code === ERR_NOT_IN_RANGE && creep.moveTo(target) !== OK) {
                    creep.memory.targetTransfer = null;
                } else {
                    creep.memory.targetTransfer = null;
                }
            }
        }
    }
}
