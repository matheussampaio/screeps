import { Kernel } from '../../../kernel'
import { RCLProgram } from '../rcl'

export class ProcessTasks {
    public static cleanChildren(rcl: RCLProgram) {
        _.forIn(rcl.memory.children, (value: any, key: string) => {
            if (_.isNumber(value) && Kernel.getProcessByPID(value) == null) {
                delete rcl.memory.children[key]

            } else if (_.isArray(value)) {
                rcl.memory.children[key] = value.filter((pid: number) => Kernel.getProcessByPID(pid) != null)

            } else {
                _.forIn(value, (__: any, pid: string) => {
                    if (Kernel.getProcessByPID(parseInt(pid, 10)) == null) {
                        delete value[pid]
                    }
                })
            }
        })

        return true
    }
}
