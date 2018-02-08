import { FindSource } from './find-source'
import { BuildContainer } from './build-container'
import { Action, ActionRegistry } from '../../../engine'
import { FindMovementTarget } from './find-movement-target'

@ActionRegistry.register
export class HarvesterEnergy extends Action {
    run(creep: Creep) {
        const source: Source | null = Game.getObjectById(creep.memory.source)

        if (source == null) {
            return this.unshiftAndContinue(FindSource.name)
        }

        creep.memory.room = creep.memory.room || creep.room.name

        // update source miner
        if (Game.rooms[creep.memory.room].memory.sources != null) {
            Game.rooms[creep.memory.room].memory.sources[creep.memory.source] = creep.name
        }

        // if doesnt have target, find one
        if (creep.memory.target == null) {
            return this.unshiftAndContinue(FindMovementTarget.name)
        }

        const target: RoomPosition | null = creep.room.getPositionAt(creep.memory.target.x, creep.memory.target.y)

        if (target && !creep.pos.isEqualTo(target)) {
            creep.travelTo(target)

            return this.shiftAndStop()
        }

        // create container
        if (
            creep.memory.working &&
            creep.getActiveBodyparts(WORK) &&
            creep.getActiveBodyparts(CARRY) &&
            Game.time % 10 === 0
        ) {
            return this.unshiftAndContinue(BuildContainer.name)
        }

        if (source.energy) {
            const result = creep.harvest(source)

            if (result === OK) {
                creep.memory.working = true
            }
        }

        const linkId: string = _.get(creep, `room.memory.links.sources.${creep.memory.source}`)

        if (linkId && creep.carry.energy) {
            const link: StructureLink = Game.getObjectById(linkId)

            if (link.energy < link.energyCapacity) {
                const result = creep.transfer(link, RESOURCE_ENERGY)

                if (result === ERR_NOT_IN_RANGE) {
                    creep.travelTo(link)
                }
            } else if (link.cooldown === 0) {
                const linkStorageId: string = _.get(creep, 'room.memory.links.storage')

                if (linkStorageId) {
                    const linkStorage: StructureLink = Game.getObjectById(linkStorageId)

                    if (linkStorage.energy === 0) {
                        link.transferEnergy(linkStorage)
                    } else {
                        const linkControllerId: string = _.get(creep, 'room.memory.links.controller')

                        if (linkControllerId) {
                            const linkController: StructureLink = Game.getObjectById(linkControllerId)

                            if (linkController.energy === 0) {
                                link.transferEnergy(linkStorage)
                            }
                        }
                    }
                }
            }
        }

        return this.shiftAndStop()
    }
}
