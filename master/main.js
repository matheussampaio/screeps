const roleBuilder = require('role.builder');
const roleUpgrader = require('role.upgrader');
const roleHarvester = require('role.harvester');

module.exports.loop = function loop() {
    console.log(Game.time);
    
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }
    
    const count = {
        harvesters: 0,
        upgraders: 0,
        builders: 0
    };

    for (const name in Game.creeps) {
        const creep = Game.creeps[name];

        if (creep.memory.role === 'harvester') {
            roleHarvester.run(creep);
            count.harvesters += 1;

        } else if (creep.memory.role === 'upgrader') {
            roleUpgrader.run(creep);
            count.upgraders += 1;

        } else if (creep.memory.role === 'builder') {
            roleBuilder.run(creep);
            count.builders += 1;
        }
    }
    
    if (count.harvesters < 3) {
        Game.spawns.Spawn1.createCreep([WORK, CARRY, MOVE], { role: 'harvester' });
        
    } else if (count.upgraders < 2) {
        Game.spawns.Spawn1.createCreep([WORK, CARRY, MOVE], { role: 'upgrader' });

    } else if (count.builders < 2) {
        Game.spawns.Spawn1.createCreep([WORK, CARRY, MOVE], { role: 'builder' });
    }
}
