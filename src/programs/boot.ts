import { Process, RegisterProcess } from '../os'

@RegisterProcess
export class Boot extends Process {
  public run() {
    this.pcb.memory.counter = this.pcb.memory.counter || 0

    this.log.debug('Boot is running', this.pcb.memory.counter++)
  }
}
