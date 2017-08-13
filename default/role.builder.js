const roleUpgrader = require('role.upgrader');

const roleBuilder = {
    run(creep) {
        if (creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
        }

        if (!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
            creep.say('🚧 build');
        }

        if (creep.memory.building) {
            const construction = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);

            if (construction) {
                if (creep.build(construction) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(construction, {
                        visualizePathStyle: {
                            stroke: '#ff0000'
                        }
                    });
                }
            // if no constructionSite is found
            } else {
                roleUpgrader.run(creep);
            }

        // if creep is supposed to harvest energy from source
        } else {
            const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {
                    visualizePathStyle: {
                        stroke: '#00ff00'
                    }
                });
            }
        }
    }
};

module.exports = roleBuilder;
