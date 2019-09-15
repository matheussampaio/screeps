import { Process, RegisterProcess } from '@sae/os'

@RegisterProcess
export class Boot extends Process {
  public run() {
    this.pcb.memory.counter = this.pcb.memory.counter ?? 0

    console.log('Boot is running', this.pcb.memory.counter++)
  }
}
