import * as _ from 'lodash'

declare global {
  interface Memory {
    configs?: {
      logLevel?: number
    }
  }
}

export enum LOG_LEVEL {
  error = 10,
  warn = 20,
  info = 30,
  debug = 40,
  trace = 50
}

Memory.configs = {
  logLevel: LOG_LEVEL.info
}

export class Logger {
  public error(msg: any, ...data: any[]) {
    return this.log(LOG_LEVEL.error, msg, data)
  }

  public warn(msg: any, ...data: any[]) {
    return this.log(LOG_LEVEL.warn, msg, data)
  }

  public info(msg: any, ...data: any[]) {
    return this.log(LOG_LEVEL.info, msg, data)
  }

  public debug(msg: any, ...data: any[]) {
    return this.log(LOG_LEVEL.debug, msg, data)
  }

  public trace(msg: any, ...data: any[]) {
    return this.log(LOG_LEVEL.trace, msg, data)
  }

  private log(level: LOG_LEVEL, msg: any, data: any[]) {
    const loglevel = _.get(Memory, 'configs.logLevel', LOG_LEVEL.info)

    if (loglevel >= level) {
      console.log(`date=${Date.now()},level=${level},msg="${msg}"`, ...data)
    }
  }
}
