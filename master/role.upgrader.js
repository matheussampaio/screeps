const roleUpgrader = {
    run(creep) {
        if (creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
            creep.memory.targetEnergy = null;
            creep.say('U: E!');
        }

        if (!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
            creep.memory.upgrading = true;
            creep.say('U: U!');
        }

        if (creep.memory.upgrading) {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
            
        } else {
            if (creep.memory.targetEnergy == null) {
                const resources = Game.rooms.W17N21.find(FIND_DROPPED_RESOURCES);
                
                if (resources.length) {
                    creep.memory.targetEnergy = _.sample(resources).id;
                }
            }
            
            const target = Game.getObjectById(creep.memory.targetEnergy);
            
            if (target == null) {
                creep.memory.targetEnergy = null;
            }
            
            if (creep.memory.targetEnergy != null && creep.pickup(target) == ERR_NOT_IN_RANGE) {
                if (creep.moveTo(target) === ERR_NO_PATH) {
                    creep.memory.targetEnergy = null;
                }
            }
        }
    }
};

module.exports = roleUpgrader;
