export class ProcessRegistry {
  private static readonly registry: { [processName: string]: any } = {};

  public static register(constructor: any) {
    ProcessRegistry.registry[constructor.name] = constructor;
  }

  public static getProcessConstructorFromName(processName: string) {
    return ProcessRegistry.registry[processName];
  }
}
