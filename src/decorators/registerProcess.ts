import { ProcessRegistry } from '../kernel/process-registry'

export function registerProcess(constructor) {
    ProcessRegistry.register(constructor)
}
