import Mission from './mission';
import { createCreep, calculateBody } from '../utils/utils';

export default class UpgradeController extends Mission {
    prerun() {
        this.creeps = createCreep({
            role: 'U',
            room: this.flag.room,
            number: 10,
            getBody: () => calculateBody({
                energyAvailable: this.flag.room.energyAvailable,
                work: [1, 30],
                carry: [1, 30],
                move: [1, 30]
            })
        });

        return this.creeps.length;
    }

    run() {
        this.creeps.forEach((creep) => {
            if (creep.carry.energy) {
                return this.upgradeController(creep);
            }

            return this.getEnergy(creep);
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

    upgradeController(creep) {
        if (creep.upgradeController(this.flag.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(this.flag.room.controller);
        }
    }
}
