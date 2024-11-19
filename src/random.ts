// https://stackoverflow.com/a/47593316
function splitmix32(_seed?: number) {
  let a = _seed ?? Math.random() * 100000000;
  return function() {
    a |= 0;
    a = a + 0x9e3779b9 | 0;
    let t = a ^ a >>> 16;
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  }
}

interface IRandom {
  seed: number | undefined
  next: () => number
  reset(): void
  randint(min: number, max: number): number
}

const SEED = undefined
export const Random: IRandom = {
  seed: SEED,
  next: splitmix32(SEED),
  reset() {
    this.next = splitmix32(this.seed)
  },
  randint(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min
  },
}
