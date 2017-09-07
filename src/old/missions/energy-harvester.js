import Mission from './mission';
import { createCreep, calculateBody } from '../utils/utils';

export default class EnergyHarvester extends Mission {
    prerun() {
        const sources = this.flag.room.find(FIND_SOURCES_ACTIVE);

        this.creeps = createCreep({
            role: 'EH',
            room: this.flag.room,
            number: sources.length,
            getBody: () => calculateBody({
                energyAvailable: this.flag.room.energyAvailable,
                work: [1, 6],
                move: [1, 1]
            }),
            getMemory: ({ creeps }) => {
                const diff = _.difference(sources.map(source => source.id), creeps.map(creep => creep.memory.target));

                if (diff.length === 0) {
                    throw new Error('target not found');
                }

                return { target: diff[0] };
            }
        });

        return this.creeps.length;
    }

    run() {
        this.creeps.forEach((creep) => {
            if (creep.memory.target) {
                const target = Game.getObjectById(creep.memory.target);

                if (creep.harvest(target) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
        });
    }
}
