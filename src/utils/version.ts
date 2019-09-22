import { version } from '../../package.json'

declare global {
  interface Memory {
    version: string
  }
}

export default function getVersion(): string {
  if (Memory.version !== version) {
    Memory.version = version
  }

  return Memory.version
}
