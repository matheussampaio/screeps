const roleUpgrader = require('role.upgrader');

const roleBuilder = {
    run(creep) {
        if (creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.memory.targetEnergy = null;
        }

        if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
            creep.memory.targetBuild = null;
        }

        if (creep.memory.building) {
            if (creep.memory.targetBuild == null) {
                const constructions = Game.rooms.W17N21.find(FIND_MY_CONSTRUCTION_SITES)
                    .sort((a, b) => (a.progressTotal - a.progress) - (b.progressTotal - b.progress))
                    .slice(0, 5);
                    
                if (constructions.length) {
                    creep.memory.targetBuild = _.sample(constructions).id;
                }
            }
            
            const target = Game.getObjectById(creep.memory.targetBuild);
            
            if (target == null) {
                creep.memory.targetBuild = null;
            }
            
            if (creep.memory.targetBuild) {
                const code = creep.build(target);
                
                if (code !== OK) {
                    if (code === ERR_NOT_IN_RANGE && creep.moveTo(target) !== OK) {
                        creep.memory.targetBuild = null;
                    } else {
                        creep.memory.targetBuild = null;
                    }
                }
                
            // if no constructionSite is found
            } else {
                roleUpgrader.run(creep);
            }

        // if creep is supposed to harvest energy from source
        } else {
            if (creep.memory.targetEnergy == null) {
                const sources = Game.rooms.W17N21.find(FIND_DROPPED_RESOURCES);
                
                 if (sources.length) {
                    creep.memory.targetEnergy = _.sample(sources).id;
                }
            }
            
            const target = Game.getObjectById(creep.memory.targetEnergy);
            
            if (target == null) {
                creep.memory.targetEnergy = null;
            }
            
            if (creep.memory.targetEnergy && creep.pickup(target) == ERR_NOT_IN_RANGE) {
                if (creep.moveTo(target) !== OK) {
                    creep.memory.targetEnergy = null;
                }
            }
        }
    }
};

module.exports = roleBuilder;
