class Utils {
    static log(...args) {
        const output = args.map(e => JSON.stringify(e, null, 2));

        console.log(...output);
    }
}

module.exports = Utils;
