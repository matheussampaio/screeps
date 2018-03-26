export function installCreepPrototype() {
    Creep.prototype.getTarget = function getTarget(type, opts) {
        const property = (opts && opts.prop) || 'target'

        // if we have a previous target, try to use it
        if (this.memory[property] != null) {
            const target = Game.getObjectById(this.memory[property])

            if (target != null) {
                return target
            }
        }

        // but if object is gone, find another one
        const result = this.pos.findClosestByPath(type, opts)

        if (result != null) {
            this.memory[property] = result.id

            return Game.getObjectById(this.memory[property])
        }

        delete this.memory[property]

        return null
    }

    Creep.prototype.dieInPeace = function dieInPeace(substitue) {
        substitue.memory = _.cloneDeep(this.memory)

        this.memory = undefined

        this.suicide()
    }

    Creep.prototype.serializeBody = function serializeBody() {
        if (this.__serializeBody) {
            return this.__serializeBody
        }

        this.__serializeBody = ''

        for (const part of this.body) {
            this.__serializeBody += part.type === CLAIM ? part.type[1] : part.type[0]
        }

        return this.__serializeBody
    }

    Creep.uncompressBody = function parseBodyString(compactBody) {
        return _.map(compactBody, p => {
            switch (p) {
                case MOVE[0]:
                    return MOVE
                case WORK[0]:
                    return WORK
                case CARRY[0]:
                    return CARRY
                case ATTACK[0]:
                    return ATTACK
                case RANGED_ATTACK[0]:
                    return RANGED_ATTACK
                case TOUGH[0]:
                    return TOUGH
                case HEAL[0]:
                    return HEAL
                case CLAIM[1]:
                    return CLAIM
                default:
                    return MOVE
            }
        })
    }

    Creep.compressBody = function compressBody(body) {
        return _.reduce(
            body,
            (compressed, part) => {
                if (part === CLAIM) {
                    return compressed + part[1]
                }

                return compressed + part[0]
            },
            ''
        )
    }

    Creep.energyNeededFromCompressedBody = function energyNeededFromCompressedBody(body) {
        return _.sum(body.split(''), part => {
            switch (part) {
                case MOVE[0]:
                    return BODYPART_COST[MOVE]
                case WORK[0]:
                    return BODYPART_COST[WORK]
                case CARRY[0]:
                    return BODYPART_COST[CARRY]
                case ATTACK[0]:
                    return BODYPART_COST[ATTACK]
                case RANGED_ATTACK[0]:
                    return BODYPART_COST[RANGED_ATTACK]
                case TOUGH[0]:
                    return BODYPART_COST[TOUGH]
                case HEAL[0]:
                    return BODYPART_COST[HEAL]
                case CLAIM[1]:
                    return BODYPART_COST[CLAIM]
                default:
                    return 0
            }
        })
    }
}
