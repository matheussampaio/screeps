export interface ICreepRole {
    critical: number,
    defaults: string[][],
    maximum: number,
    level: number,
    process?(room: Room, creeps: Creep[], critical?: boolean): string[] | string | null
}
