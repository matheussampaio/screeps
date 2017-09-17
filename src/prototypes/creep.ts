declare global {
    interface Creep {
        __serializeBody: [number, string]

        dieInPeace(substitue: Creep): void
        getTarget(type: number, opts?: FindPathOpts & {
            filter?: any | string;
            algorithm?: string;
            prop?: string;
        }): RoomObject | null
        serializeBody(): [number, string]
    }
}

export function CreepInstall() {
    Creep.prototype.getTarget = function getTarget(type: number, opts?: FindPathOpts & {
            filter?: any | string;
            algorithm?: string;
            prop?: string;
        }) {

        const property = (opts && opts.prop) || 'target'

        // if we have a previous target, try to use it
        if (this.memory[property] != null) {
            const target: RoomObject = Game.getObjectById(this.memory[property])

            if (target != null) {
                return target
            }
        }

        // but if object is gone, find another one
        const result: any = this.pos.findClosestByPath(type, opts)

        if (result != null) {
            this.memory[property] = result.id

            return Game.getObjectById(this.memory[property])
        }

        delete this.memory[property]

        return null
    }

    Creep.prototype.dieInPeace = function dieInPeace(substitue: Creep) {
        substitue.memory = _.cloneDeep(this.memory)

        this.memory = undefined

        this.suicide()
    }

    Creep.prototype.serializeBody = function serializeBody() {
        if (this.__serializeBody) {
            return this.__serializeBody
        }

        this.__serializeBody = [0, '']

        for (const part of this.body) {
            this.__serializeBody[0] += BODYPART_COST[part.type]
            this.__serializeBody[1] += part.type[0]
        }

        return this.__serializeBody
    }
}
