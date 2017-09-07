export default class Operation {
    constructor({ flag, name, index }) {
        this.flag = flag;
        this.name = name;
        this.index = index;

        this.missions = [];
    }

    init() {
        console.log('ERROR: You have to implement the method init!');

        return false;
    }

    prerun() {
        this.missions = this.missions.filter((mission) => {
            try {
                return mission.prerun();
            } catch (error) {
                console.log(mission, error.stack);
                return false;
            }
        });
    }

    run() {
        this.missions = this.missions.filter((mission) => {
            try {
                return mission.run();
            } catch (error) {
                console.log(mission, error.stack);
                return false;
            }
        });
    }

    postrun() {
        this.missions = this.missions.filter((mission) => {
            try {
                return mission.postrun();
            } catch (error) {
                console.log(mission, error.stack);
                return false;
            }
        });
    }

    toString() {
        return `OPERATION: name=${this.name} index=${this.index}`;
    }
}
