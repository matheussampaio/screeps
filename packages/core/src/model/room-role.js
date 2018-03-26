export class RoomRole {
    defaults() {
        return []
    }

    role() {
        return this.constructor.name
    }
}
