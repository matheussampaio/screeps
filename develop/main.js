const roleBuilder = require('role.builder');
const roleUpgrader = require('role.upgrader');
const roleHarvester = require('role.harvester');

module.exports.loop = function () {

    // var tower = Game.getObjectById('cb9133b25dfa58b50626fafe');
    //
    // if(tower) {
    //     var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
    //         filter: (structure) => structure.hits < structure.hitsMax
    //     });
    //     if(closestDamagedStructure) {
    //         tower.repair(closestDamagedStructure);
    //     }
    //
    //     var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    //     if(closestHostile) {
    //         tower.attack(closestHostile);
    //     }
    // }

    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    const creeps = {
        harvesters: 0,
        upgraders: 0,
        builders: 0
    };

    for (const name in Game.creeps) {
        const creep = Game.creeps[name];

        if (creep.memory.role === 'harvester') {
            roleHarvester.run(creep);
            creeps.harvesters += 1;

        } else if (creep.memory.role === 'upgrader') {
            roleUpgrader.run(creep);
            creeps.upgraders += 1;

        } else if (creep.memory.role === 'builder') {
            roleBuilder.run(creep);
            creeps.builders += 1;
        }
    }

    if (creeps.upgraders < 2) {
        const creep = [WORK, CARRY, MOVE, MOVE];

        Game.spawns.Spawn1.createCreep(creep, { role: 'upgrader' });
    } else if (creeps.builders < 6) {
        const creep = [WORK, WORK, CARRY, MOVE];

        Game.spawns.Spawn1.createCreep(creep, { role: 'builder' });
    } else if (creeps.harvesters < 3) {
        const creep = [WORK, CARRY, MOVE, MOVE];

        Game.spawns.Spawn1.createCreep(creep, { role: 'harvester' });
    }
}
