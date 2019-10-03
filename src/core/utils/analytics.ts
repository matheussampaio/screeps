declare global {
  interface Memory {
    analytics: object
  }
}

export class Analytics {
  public get memory() {
    Memory.analytics = Memory.analytics || {}

    return Memory.analytics
  }
}
