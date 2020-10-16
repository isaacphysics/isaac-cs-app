// undefined|null checker and type guard all-in-wonder.
// Why is this not in Typescript?
export function isDefined<T>(stuff: T): stuff is NonNullable<T> {
    return stuff !== undefined && stuff !== null
}

export const overflowModulus = (x: number, mod: number): number => {
    return (x + mod) % mod;
}