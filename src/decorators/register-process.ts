import { ProcessRegistry } from '../kernel'

export function RegisterProcess(constructor) {
    ProcessRegistry.register(constructor)
}
