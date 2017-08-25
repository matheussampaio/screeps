export class ProcessRegistry {
    private static readonly registry = {};

    public static register(constructor) {
        ProcessRegistry.registry[constructor.name] = constructor;
    }

    public static fetch(processName) {
        return ProcessRegistry.registry[processName];
    }
}
