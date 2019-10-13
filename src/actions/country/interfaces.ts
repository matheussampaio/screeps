export interface ICountryContext {
  rooms: { [roomName: string]: number }
}

declare global {
  interface RoomMemory {
    PID: number
  }
}
