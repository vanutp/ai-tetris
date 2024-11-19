export function get(id: string): HTMLElement {
  const res = document.getElementById(id)
  if (!res) {
    throw new Error(`Element with id ${id} not found`)
  }
  return res
}

export function hide(id: string) {
  get(id).style.visibility = 'hidden'
}

export function show(id: string) {
  get(id).style.visibility = ''
}

export function text(id: string, text: any) {
  get(id).innerText = text.toString()
}

export function timestamp() {
  return new Date().getTime()
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export enum Action {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
  AI = -1,
  FAST_FORWARD = -2,
}

export enum Direction {
  UP = 0,
  RIGHT = 1,
  DOWN = 2,
  LEFT = 3,
  MIN = 0,
  MAX = 3,
}

export enum Key {
  ESC = 27,
  SPACE = 32,
  LEFT = 37,
  UP = 38,
  RIGHT = 39,
  DOWN = 40,
}

export interface PieceType {
  size: number
  blocks: number[]
  color: string
  xOffset: number[]
}

export interface Piece {
  type: PieceType
  dir: Direction
  x: number
  y: number
}

/**
 * tetris pieces
 * blocks: each element represents a rotation of the piece (0, 90, 180, 270)
 *         each element is a 16-bit integer where the 16 bits represent
 *         a 4x4 set of blocks, e.g. j.blocks[0] = 0x44C0
 *
 *             0100 = 0x4 << 3 = 0x4000
 *             0100 = 0x4 << 2 = 0x0400
 *             1100 = 0xC << 1 = 0x00C0
 *             0000 = 0x0 << 0 = 0x0000
 *                               ------
 *                               0x44C0
 */
export const PIECE_TYPES: PieceType[] = [
  Object.freeze({ size: 4, blocks: [0x0F00, 0x2222, 0x00F0, 0x4444], color: 'cyan', xOffset: [0, 2, 0, 1] }),
  Object.freeze({ size: 3, blocks: [0x44C0, 0x8E00, 0x6440, 0x0E20], color: 'blue', xOffset: [0, 0, 1, 0] }),
  Object.freeze({ size: 3, blocks: [0x4460, 0x0E80, 0xC440, 0x2E00], color: 'orange', xOffset: [1, 0, 0, 0] }),
  Object.freeze({ size: 2, blocks: [0xCC00, 0xCC00, 0xCC00, 0xCC00], color: 'yellow', xOffset: [0, 0, 0, 0] }),
  Object.freeze({ size: 3, blocks: [0x06C0, 0x8C40, 0x6C00, 0x4620], color: 'green', xOffset: [0, 0, 0, 1] }),
  Object.freeze({ size: 3, blocks: [0x0E40, 0x4C40, 0x4E00, 0x4640], color: 'purple', xOffset: [0, 0, 0, 1] }),
  Object.freeze({ size: 3, blocks: [0x0C60, 0x4C80, 0xC600, 0x2640], color: 'red', xOffset: [0, 0, 0, 1] }),
]

/**
 * do the bit manipulation and iterate through each
 * occupied block (x,y) for a given piece
 */
export function eachblock(piece: Piece, fn: (x: number, y: number) => void) {
  let row = 0
  let col = 0
  let blocks = piece.type.blocks[piece.dir]
  for (let bit = 0x8000; bit > 0; bit = bit >> 1) {
    if (blocks & bit) {
      fn(piece.x + col, piece.y + row)
    }
    if (++col === 4) {
      col = 0
      ++row
    }
  }
}
