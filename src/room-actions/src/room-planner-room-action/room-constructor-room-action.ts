import { Action, ActionRegistry, CreepRoleRegistry } from '../../../engine'

export const TEMPLATE_SIZE_11: any = {
    0: {
        spawn: [{ x: 0, y: -4 }]
    },
    1: {},
    2: {
        extension: [{ x: -5, y: -5 }, { x: -4, y: -5 }, { x: -3, y: -5 }, { x: -2, y: -5 }, { x: -1, y: -5 }]
    },
    3: {
        extension: [{ x: 1, y: -5 }, { x: 2, y: -5 }, { x: 3, y: -5 }, { x: 4, y: -5 }, { x: 5, y: -5 }],
        tower: [{ x: -1, y: -2 }]
    },
    4: {
        extension: [
            { x: -5, y: -4 },
            { x: -3, y: -4 },
            { x: -2, y: -4 },
            { x: 2, y: -4 },
            { x: 3, y: -4 },
            { x: 5, y: -4 },
            { x: -5, y: -3 },
            { x: -4, y: -3 },
            { x: -2, y: -3 },
            { x: -1, y: -3 }
        ],
        storage: [{ x: 0, y: 0 }],
        road: [
            { x: 0, y: -5 },
            { x: -4, y: -4 },
            { x: -1, y: -4 },
            { x: 1, y: -4 },
            { x: 4, y: -4 },
            { x: -3, y: -3 },
            { x: 0, y: -3 },
            { x: 3, y: -3 },
            { x: -2, y: -2 },
            { x: 0, y: -2 },
            { x: 2, y: -2 },
            { x: -4, y: -1 },
            { x: -1, y: -1 },
            { x: 1, y: -1 },
            { x: 4, y: -1 },
            { x: -5, y: 0 },
            { x: -3, y: 0 },
            { x: -2, y: 0 },
            { x: 2, y: 0 },
            { x: 3, y: 0 },
            { x: 5, y: 0 },
            { x: -4, y: 1 },
            { x: -1, y: 1 },
            { x: 1, y: 1 },
            { x: 4, y: 1 },
            { x: -2, y: 2 },
            { x: 0, y: 2 },
            { x: 2, y: 2 },
            { x: -3, y: 3 },
            { x: 0, y: 3 },
            { x: 3, y: 3 },
            { x: -4, y: 4 },
            { x: -1, y: 4 },
            { x: 1, y: 4 },
            { x: 4, y: 4 },
            { x: 0, y: 5 }
        ],
        rampart: []
    },
    5: {
        extension: [
            { x: 1, y: -3 },
            { x: 2, y: -3 },
            { x: 4, y: -3 },
            { x: 5, y: -3 },
            { x: -5, y: -2 },
            { x: -4, y: -2 },
            { x: -3, y: -2 },
            { x: 3, y: -2 },
            { x: 4, y: -2 },
            { x: 5, y: -2 }
        ],
        tower: [{ x: 1, y: -2 }],
        link: [{ x: 0, y: -1 }]
    },
    6: {
        extension: [
            { x: -5, y: -1 },
            { x: -3, y: -1 },
            { x: 3, y: -1 },
            { x: 5, y: -1 },
            { x: -5, y: 1 },
            { x: 3, y: 1 },
            { x: 5, y: 1 },
            { x: -5, y: 2 },
            { x: 3, y: 2 },
            { x: 4, y: 2 }
        ],
        terminal: [{ x: 0, y: 1 }],
        lab: [{ x: -3, y: 1 }, { x: -2, y: 1 }, { x: -4, y: 2 }]
    },
    7: {
        extension: [
            { x: 5, y: 2 },
            { x: -5, y: 3 },
            { x: 1, y: 3 },
            { x: 2, y: 3 },
            { x: 4, y: 3 },
            { x: 5, y: 3 },
            { x: -5, y: 4 },
            { x: 2, y: 4 },
            { x: 3, y: 4 },
            { x: 5, y: 4 }
        ],
        tower: [{ x: -2, y: -1 }],
        spawn: [{ x: -4, y: 0 }],
        lab: [{ x: -3, y: 2 }, { x: -1, y: 2 }, { x: -4, y: 3 }]
    },
    8: {
        extension: [
            { x: -5, y: 5 },
            { x: -4, y: 5 },
            { x: -3, y: 5 },
            { x: -2, y: 5 },
            { x: -1, y: 5 },
            { x: 1, y: 5 },
            { x: 2, y: 5 },
            { x: 3, y: 5 },
            { x: 4, y: 5 },
            { x: 5, y: 5 }
        ],
        spawn: [{ x: 4, y: 0 }],
        tower: [{ x: 2, y: -1 }, { x: 2, y: 1 }],
        powerSpawn: [{ x: 0, y: 4 }],
        nuker: [{ x: -1, y: 0 }],
        observer: [{ x: 1, y: 0 }],
        lab: [{ x: -2, y: 3 }, { x: -1, y: 3 }, { x: -3, y: 4 }, { x: -2, y: 4 }]
    }
}

@ActionRegistry.register
export class RoomConstructorRoomAction extends Action {
    run(room: Room) {
        const center = room.memory.center

        if (center == null) {
            return this.shiftAndStop()
        }

        for (let i = 2; i <= room.controller!.level; i++) {
            const templateLevel = TEMPLATE_SIZE_11[i]

            for (const type in templateLevel) {
                for (const position of templateLevel[type]) {
                    const structures = room.lookForAt(LOOK_STRUCTURES, center.x + position.x, center.y + position.y)

                    if (structures.length) {
                        continue
                    }

                    const constructions = room.lookForAt(
                        LOOK_CONSTRUCTION_SITES,
                        center.x + position.x,
                        center.y + position.y
                    )

                    if (constructions.length) {
                        return this.shiftAndStop()
                    }

                    const result = room.createConstructionSite(
                        center.x + position.x,
                        center.y + position.y,
                        type as BuildableStructureConstant
                    )

                    if (result === OK) {
                        return this.shiftAndStop()
                    }
                }
            }
        }

        // TODO: Idle for some ticks
        return this.shiftAndStop()
    }
}
