import { registerProcess } from '../decorators/registerProcess'
import { Kernel } from '../kernel'
import { Process } from '../kernel/Process'
import { ProcessRegistry } from '../kernel/process-registry'

@registerProcess
export class SpawnProcess extends Process {
    public run() {
        this.memory.request = this.memory.request || []

        if (this.memory.request.length === 0) {
            return
        }

        // TODO: Sort by priority
        const req = this.memory.request[0]

        const spawns = _.filter(Game.spawns, (s) => {
            return s.room.name === this.memory.roomName && s.spawning == null && s.isActive()
        })

        if (spawns.length === 0) {
            // return console.log('spawn not found')
            return
        }

        const spawn = spawns[0]

        const ProcessCreep = ProcessRegistry.fetch(req.process)

        if (ProcessCreep == null) {
            console.log('cant find process', req.process)
            return
        }

        const ParentProcess = Kernel.getProcessByPID(req.parentPID)

        if (ParentProcess == null) {
            this.memory.request.shift()

            return console.log('Parent process died')
        } else if (ParentProcess.receiveCreep == null) {
            return console.log('Process cant receive creeps, please, implement receiveCreep')
        }

        if (spawn.canCreateCreep(req.body) !== OK) {
            // return console.log('Cant create creep right now')
            return
        }

        const creepName = spawn.createCreep(req.body)

        if (_.isString(creepName)) {
            this.memory.request.shift()

            req.memory.creepName = creepName

            const pid = ProcessCreep.start({
                memory: req.memory,
                parentPID: req.parentPID
            })

            ParentProcess.receiveCreep(pid, creepName, req.process)
        } else {
            console.log('error creating creep', creepName)
        }
    }

    public add(request) {
        this.memory.request = this.memory.request = []

        const result = _.find(this.memory.request, (r) => {
            return r.process === request.process && r.parentPID === request.parentPID
        })

        if (result == null) {
            this.memory.request.push(request)
        }
    }
}
