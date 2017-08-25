export default class Mission {
    constructor(flag) {
        this.flag = flag;
    }

    prerun() {
        return true;
    }

    run() {
        return true;
    }

    postrun() {
        return true;
    }

    toString() {
        const name = this.constructor.name;

        return `${name}.${this.flag.name}`;
    }
}
