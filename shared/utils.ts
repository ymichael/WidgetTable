export function assertUnreachable(x: never): never {
  throw new Error("Didn't expect to get here");
}

let id = 0;

export const genId = (): string => `id-${id++}`;
