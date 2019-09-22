declare global {
  interface Memory {
    logLevel?: number
  }
}

export enum LOG_LEVEL {
  error = 10,
  warn = 20,
  info = 30,
  debug = 40,
  trace = 50
}

export class Logger {
  private readonly level: LOG_LEVEL

  constructor(level: LOG_LEVEL) {
    this.level = level
  }

  public error(msg: string, ...data: any[]) {
    return this.log(LOG_LEVEL.error, msg, data)
  }

  public warn(msg: string, ...data: any[]) {
    return this.log(LOG_LEVEL.warn, msg, data)
  }

  public info(msg: string, ...data: any[]) {
    return this.log(LOG_LEVEL.info, msg, data)
  }

  public debug(msg: string, ...data: any[]) {
    return this.log(LOG_LEVEL.debug, msg, data)
  }

  public trace(msg: string, ...data: any[]) {
    return this.log(LOG_LEVEL.trace, msg, data)
  }

  private log(level: LOG_LEVEL, msg: string, data: any[]) {
    const loglevel = Memory.logLevel || this.level

    if (loglevel >= level) {
      console.log(`date=${Date.now()},level=${level},msg="${msg}"`, ...data)
    }
  }
}
