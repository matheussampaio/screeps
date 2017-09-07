import { registerProcess } from '../../decorators/registerProcess'
import { Kernel } from '../../kernel'
import { Process } from '../../kernel/process'

@registerProcess
export class HarvesterCreep extends Process {
    public static touch() {}

    public run() {

    }
}

