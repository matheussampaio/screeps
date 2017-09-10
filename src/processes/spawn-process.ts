import { RegisterProcess } from '../decorators'
import { Kernel, Process } from '../kernel'
import { CODES, DEBUG, PRIORITY } from '../utils'

export interface IRequestCreep {
    body: string[],
    parentPID: number,
    priority: PRIORITY,
    role: string,

    memory?: any
}

@RegisterProcess
export class SpawnProcess extends Process {
    public run(): CODES {

        this.memory.request = this.memory.request || []

        if (this.memory.request.length === 0) {
            return this.debug('[]') ? CODES.OK : this.idle()
        }

        const spawn = _.find(Game.spawns, (s) => s.room.name === this.memory.roomName && s.spawning == null)

        if (spawn == null) {
            return this.debug(`busy`) ? CODES.OK : this.idle(5)
        }

        let req = this.memory.request[0]
        let ParentProcess = Kernel.getProcessByPID(req.parentPID) as Process

        while (ParentProcess == null || ParentProcess.receiveCreep == null) {
            this.memory.request.shift()

            if (this.memory.request.length === 0) {
                return this.debug('[]') ? CODES.OK : this.idle()
            }

            req = this.memory.request[0]
            ParentProcess = Kernel.getProcessByPID(req.parentPID) as Process
        }

        const cost = spawn.getCreepCost(req.body)
        const room = Game.rooms[this.memory.roomName]

        if (cost > room.energyAvailable) {
            return this.debug(`+${cost - room.energyAvailable} ${req.role}`) ? CODES.OK : this.idle(room.energyAvailable - cost)
        }

        const creepName = spawn.createCreep(req.body, req.memory)

        if (_.isString(creepName)) {
            this.memory.request.shift()

            ParentProcess.receiveCreep(creepName)
        } else {
            this.debug(`ERROR: ${creepName}`)
        }

        return CODES.OK
    }

    public add(request: IRequestCreep) {
        this.memory.request = this.memory.request || []

        const result = _.find(this.memory.request, (r: IRequestCreep) => {
            return r.role === request.role && r.parentPID === request.parentPID
        })

        if (result == null) {
            request.memory.role = request.role

            this.memory.request.push(request)

            this.memory.request.sort((a: IRequestCreep, b: IRequestCreep) => b.priority - a.priority)

            this.wakeUp()
        }
    }

    private debug(text): boolean {
        if (DEBUG.SPAWN) {
            const room: Room = Game.rooms[this.memory.roomName]
            const spawn = _.find(Game.spawns, (s) => s.room.name === this.memory.roomName)

            if (spawn != null) {
                room.visual.text(text, spawn.pos.x + 2, spawn.pos.y, { font: 0.5 })
            }
        }

        return DEBUG.SPAWN
    }
}
