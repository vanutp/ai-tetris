import { Direction, Piece } from './utils.ts'
import { Board } from './board.ts'

export interface Move {
  x: number,
  dir: Direction,
}

export abstract class Agent {
  abstract selectBestMove(board: Board, piece: Piece, nextPiece: Piece): Move
}
