import { Process } from '../os'

export class Boot extends Process {
  public run() {
    console.log('Boot run')
  }
}
