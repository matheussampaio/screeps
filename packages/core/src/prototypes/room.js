import { Priority } from '../util'

export function installRoomPrototype() {
  Object.defineProperty(Room.prototype, 'creeps', {
    get() {
      if (this.__creeps != null) {
        return this.__creeps
      }

      this.__creeps = _.chain(Game.creeps)
        .filter(creep => creep.my && creep.memory.role && creep.memory.room === this.name)
        .tap((array) => {
          this.queue.forEach((req) => {
            array.push(Object.assign({ request: true }, req))
          })
        })
        .groupBy(creep => creep.memory.role)
        .value()

      return this.__creeps
    }
  })

  Object.defineProperty(Room.prototype, 'queue', {
    get() {
      if (this.memory.queue == null) {
        this.memory.queue = []
      }

      return this.memory.queue
    },
    set(value) {
      this.memory.queue = value
    }
  })

  Object.defineProperty(Room.prototype, 'spawns', {
    get() {
      if (this.__spawns != null) {
        return this.__spawns
      }

      this.__spawns = this.find(FIND_MY_SPAWNS)

      return this.__spawns
    }
  })

  Room.prototype.queueCreep = function queueCreep({
    name, body, priority, memory = {}
  } = {}) {
    const creepRequest = {
      body,
      name,
      memory: Object.assign({ room: this.name }, memory),
      priority: priority || Priority.NORMAL,
      energyNeeded: Creep.energyNeededFromCompressedBody(body)
    }

    if (creepRequest.energyNeeded <= this.energyCapacityAvailable) {
      this.queue.push(creepRequest)

      this.queue.sort((a, b) => b.priority - a.priority)

      const { role } = creepRequest.memory

      // if we didn't have this role before, create it
      if (this.creeps[role] == null) {
        this.creeps[role] = []
      }

      // add this creep to the role array
      this.creeps[role].push(Object.assign({ request: true }, creepRequest))
    }
  }

  Room.prototype.hasFreeEnergy = function hasFreeEnergy() {
    return this.energyAvailable === this.energyCapacityAvailable && this.memory.queue.length === 0
  }

  Room.prototype.canSubstitueForABetterCreep = function canSubstitueForABetterCreep(body, role) {
    const creeps = _.filter(
      Game.creeps,
      creep => creep.my && creep.room.name === this.name && creep.memory.role === role
    ).sort((c1, c2) => {
      if (c1.body.length !== c2.body.length) {
        return c1.body.length - c2.body.length
      }

      return c1.ticksToLive - c2.ticksToLive
    })

    if (creeps.length && body.length > creeps[0].body.length) {
      return creeps[0]
    }

    return null
  }
}
