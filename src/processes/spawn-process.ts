import { RegisterProcess } from '../decorators'
import { Kernel, Process } from '../kernel'
import { CODES, PRIORITY } from '../utils'

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
            return this.idle()
        }

        const spawn = _.find(Game.spawns, (s) => s.room.name === this.memory.roomName && s.spawning == null)

        if (spawn == null) {
            return this.idle(5)
        }

        let req = this.memory.request[0]
        let ParentProcess = Kernel.getProcessByPID(req.parentPID) as Process

        while (ParentProcess == null || ParentProcess.receiveCreep == null) {
            this.memory.request.shift()

            if (this.memory.request.length === 0) {
                return this.idle()
            }

            req = this.memory.request[0]
            ParentProcess = Kernel.getProcessByPID(req.parentPID) as Process
        }

        const cost = spawn.getCreepCost(req.body)
        const room = Game.rooms[this.memory.roomName]

        if (cost < room.energyAvailable) {
            return this.idle(room.energyAvailable - cost)
        }

        const creepName = spawn.createCreep(req.body, req.memory)

        if (_.isString(creepName)) {
            this.memory.request.shift()

            ParentProcess.receiveCreep(creepName)
        } else {
            console.log('error creating creep', creepName)
        }

        return CODES.OK
    }

    public add(request: IRequestCreep) {
        this.memory.request = this.memory.request || []

        const result = _.find(this.memory.request, (r: IRequestCreep) => {
            return r.role === request.role && r.parentPID === request.parentPID
        })

        if (result == null) {
            this.memory.request.push(request)

            this.memory.request.sort((a: IRequestCreep, b: IRequestCreep) => b.priority - a.priority)

            this.wakeUp()
        }
    }
}
