import EnergyCourier from '../missions/energy-courier';
import EnergyHarvester from '../missions/energy-harvester';
import UpgradeController from '../missions/upgrade-controller';

import Operation from './operation';

export default class Default extends Operation {
    init() {
        if (this.flag.room == null) {
            return false;
        }

        this.missions.push(new EnergyHarvester(this.flag));
        this.missions.push(new EnergyCourier(this.flag));
        this.missions.push(new UpgradeController(this.flag));

        return true;
    }
}
