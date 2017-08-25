export function log(...args) {
    console.log(...args.map(a => JSON.stringify(a)));
}

export function createCreep({ role, number, room, getBody, getMemory }) {
    // TODO: Get from cache
    const creeps = _.filter(Game.creeps, creep => (
        creep.room.name === room.name && creep.memory.role === role
    ));

    if (creeps.length < number) {
        // TODO: Get from cache
        const spawn = _.values(Game.spawns).find(elem => elem.room.name === room.name);

        if (spawn != null && !spawn.spawning) {
            const body = getBody();

            if (body.length && spawn.canCreateCreep(body) === OK) {
                const name = `${role}_${Game.time}`;

                let memory = { role };

                if (getMemory) {
                    memory = Object.assign(memory, getMemory({ creeps }));
                }

                const code = spawn.createCreep(body, name, memory);

                log(`Creating creep body=${body} code=${code}`);
            }
        }
    }

    return creeps;
}

export function calculateBody({ energyAvailable = 0, work = [0, 0], carry = [0, 0], move = [0, 0] }) {
    const total = work[0] * BODYPART_COST.work + carry[0] * BODYPART_COST.carry + move[0] * BODYPART_COST.move;
    const times = Math.floor(energyAvailable / total);

    const creep = [];

    for (let i = 0; i < times * work[0] && i <= work[1]; i++) {
        creep.push(WORK);
    }

    for (let i = 0; i < times * carry[0] && i <= carry[1]; i++) {
        creep.push(CARRY);
    }

    for (let i = 0; i < times * move[0] && i <= move[1]; i++) {
        creep.push(MOVE);
    }

    return creep;
}
