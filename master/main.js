const roleBuilder = require('role.builder');
const roleCourier = require('role.courier');
const roleUpgrader = require('role.upgrader');
const roleHarvester = require('role.harvester');
const roleHarvesterBig = require('role.harvester-big');

module.exports.loop = function loop() {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }
    
    const count = {
        harvesters: 0,
        upgraders: 0,
        builders: 0,
        harvestersBig: 0,
        couriers: 0
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
            
        } else if (creep.memory.role === 'static-harvester' || creep.memory.role === 'HB') {
            roleHarvesterBig.run(creep);
            count.harvestersBig += 1;
            
        } else if (creep.memory.role === 'courier') {
            roleCourier.run(creep);
            count.couriers += 1;
        }
    }
    
    if (Game.time % 5 === 0) {
        // Create first harvester
        if (count.harvester === 0 && count.harvestersBig === 0 && count.couriers === 0) {
            Game.spawns.Spawn1.createCreep([WORK, CARRY, MOVE], `H_${Game.time}`, { role: 'harvester' });
        
        // create first courier
        } else if (count.couriers === 0) {
            create({ work: 1, carry: 1, move: 1 }, 'courier', `C_${Game.time}`);
            
        // create first static harvester
        } else if (count.harvestersBig === 0) {
           Game.spawns.Spawn1.createCreep([WORK, MOVE], `H_${Game.time}`, { role: 'static-harvester' });
        
        // create all couriers
        } else if (count.couriers < 2) {
            create({ work: 1, carry: 1, move: 1 }, 'courier', `C_${Game.time}`);
        
        // create all static harvester
        } else if (count.harvestersBig < 4) {
            const work = Math.floor((Game.rooms.W17N21.energyAvailable - 50) / 100);
            
            if (work > 2) {
                create({ work, move: 1 }, 'static-harvester', `SH_${Game.time}`);
            }
        
        // create all upgraders
        } else if (count.upgraders < 1) {
            create({ work: 1, carry: 1, move: 1 }, 'upgrader', `U_${Game.time}`);
        
        // create all builders
        } else if (count.builders < 3) {
            create({ work: 1, carry: 1, move: 1 }, 'builder', `B_${Game.time}`);
        }
    }
}

function create({ work = 0, carry = 0, move = 0 }, role, name) {
    const times = Math.floor(Game.rooms.W17N21.energyAvailable / (work * 100 + carry * 50 + move * 50));
    
    if (times) {
        const creep = [];
        
        for (let i = 0; i < times * work; i++) {
            creep.push(WORK);
        }
        
        for (let i = 0; i < times * carry; i++) {
            creep.push(CARRY);
        }
        
        for (let i = 0; i < times * move; i++) {
            creep.push(MOVE);
        }
        
        const result = Game.spawns.Spawn1.createCreep(creep, name, { role });
        
        console.log(`Trying role=[${role}], result=[${result}]:`, creep);
    } else {
        console.log(`Missing energy for ${role}`);
    }
}
