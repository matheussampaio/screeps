const roleUpgrader = require('role.upgrader');

const roleCourier = {
    run(creep) {
        if (creep.memory.transfering && creep.carry.energy == 0) {
            creep.memory.transfering = false;
            creep.memory.targetEnergy = null;
        }

        if (!creep.memory.transfering && creep.carry.energy < creep.carryCapacity) {
            creep.memory.transfering = true;
            creep.memory.targetTransfer = null;
        }
        
        if (creep.memory.transfering) {
            if (creep.memory.targetTransfer == null) {
                const targets = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_TOWER) && structure.energy < structure.energyCapacity;
                    }
                });
    
                if (targets.length) {
                    creep.memory.targetTransfer = _.sample(targets).id;
                }
            }
            
            if (creep.memory.targetTransfer) {
                if (creep.transfer(Game.getObjectById(creep.memory.targetTransfer), RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    if (creep.moveTo(Game.getObjectById(creep.memory.targetTransfer)) === ERR_NO_PATH) {
                        creep.memory.targetTransfer = null;
                    }
                }
            } else {
                roleUpgrader.run(creep);
            }
            
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
            
            if (creep.memory.targetEnergy != null && creep.pickup(target) === ERR_NOT_IN_RANGE) {
                if (creep.moveTo(target) === ERR_NO_PATH) {
                    creep.memory.targetEnergy = null;
                }
            }
        }
    }
};

module.exports = roleCourier;