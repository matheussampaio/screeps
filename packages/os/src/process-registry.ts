import { TProcessConstructor } from './process'

export function RegisterProcess(constructor: TProcessConstructor) {
  ProcessRegistry.register(constructor)
}

export class ProcessRegistry {
  private static readonly registry: { [processName: string]: TProcessConstructor } = {}

  public static register(constructor: TProcessConstructor) {
    ProcessRegistry.registry[constructor.name] = constructor
  }

  public static fetch(processName: string): TProcessConstructor {
    return ProcessRegistry.registry[processName]
  }
}
