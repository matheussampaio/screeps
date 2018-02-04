export class RoomRole {
    defaults(): string[][] {
        return []
    }

    role() {
        return this.constructor.name
    }
}
