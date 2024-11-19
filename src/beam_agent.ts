import { eachblock, Piece, PIECE_TYPES, PieceType } from './utils.ts'
import { Agent, Move } from './agent.ts'
import { Board } from './board.ts'

interface PossibleMove {
  piece: Piece
  board: Board
  score?: number
  columnHeights?: number[]
  aggregateHeight?: number
  completeLines?: number
  holes?: number
  bumpiness?: number
  next?: PossibleMove
}

export class BeamAgent extends Agent {
  coefficients = {
    height: -0.58,
    completeLines: 0.76,
    holes: -0.36,
    bumpiness: -0.15,
  }

  private evaluateBoard(move: PossibleMove) {
    const board = move.board
    let aggregateHeight = 0
    let completeLines = 0
    let holes = 0
    let bumpiness = 0
    let columnHeights = new Array(board.width).fill(0)
    let maxHeight = 0

    // Calculate complete lines
    for (let y = 0; y < board.height; ++y) {
      let complete = true
      for (let x = 0; x < board.width; ++x) {
        if (!board.get(x, y)) {
          complete = false
          break
        }
      }
      if (complete) {
        board.removeLine(y)
        completeLines++
      }
    }
    move.completeLines = completeLines

    // Calculate aggregate height and column heights
    for (let x = 0; x < board.width; x++) {
      for (let y = 0; y < board.height; y++) {
        if (board.get(x, y) !== null) {
          columnHeights[x] = board.height - y
          maxHeight = Math.max(maxHeight, columnHeights[x])
          aggregateHeight += columnHeights[x]
          break
        }
      }
    }
    move.columnHeights = columnHeights
    move.aggregateHeight = aggregateHeight

    // Calculate holes
    for (let x = 0; x < board.width; x++) {
      let blockFound = false
      for (let y = 0; y < board.height; y++) {
        if (board.get(x, y) !== null) {
          blockFound = true
        } else if (blockFound && board.get(x, y) === null) {
          holes++
        }
      }
    }
    move.holes = holes

    // Calculate bumpiness
    for (let x = 0; x < board.width - 1; x++) {
      bumpiness += Math.abs(columnHeights[x] - columnHeights[x + 1])
    }
    move.bumpiness = bumpiness

    // Combine features into a heuristic score
    move.score = (
      + this.coefficients.height * aggregateHeight
      + this.coefficients.completeLines * completeLines
      + this.coefficients.holes * holes
      + this.coefficients.bumpiness * bumpiness
    )
  }

  private getPossibleMoves(board: Board, pieceType: PieceType): PossibleMove[] {
    let moves = []
    for (let dir = 0; dir < 4; dir++) {
      for (let _x = 0; _x < board.width; _x++) {
        const x = _x - pieceType.xOffset[dir]
        const y = board.getDropPosition({ type: pieceType, x, dir })
        if (y === null) {
          continue
        }
        const newPiece = { type: pieceType, x, y, dir }
        const newBoard = board.clone()
        eachblock(newPiece, (x, y) => {
          newBoard.set(x, y, pieceType)
        })
        const move = { piece: newPiece, board: newBoard }
        this.evaluateBoard(move)
        moves.push(move)
      }
    }
    return moves
  }

  private printMove(move: PossibleMove) {
    console.log('-'.repeat(20))
    console.log('Board:')
    const hl: { x: number, y: number }[] = []
    eachblock(move.piece, (x, y) => {
      hl.push({ x, y })
    })
    move.board.print((x, y) => hl.some(h => h.x == x && h.y == y))
    console.log('Complete lines:', move.completeLines)
    console.log('Column heights:', move.aggregateHeight, move.columnHeights)
    console.log('Holes:', move.holes)
    console.log('Bumpiness:', move.bumpiness)
    console.log('Score:', move.score)
  }

  private _selectBestMove(board: Board, piece: Piece | null, nextPiece: Piece | null, depth: number): PossibleMove | null {
    if (depth == 2) {
      return null
    }
    const moves = []
    if (piece) {
      moves.push(...this.getPossibleMoves(board, piece.type))
    } else {
      for (const pieceType of PIECE_TYPES) {
        moves.push(...this.getPossibleMoves(board, pieceType))
      }
    }
    moves.sort((a, b) => b.score! - a.score!)
    const bestMoves = moves.slice(0, 10)
    let bestMove: PossibleMove | null = null
    let bestScore = -Infinity
    for (const move of bestMoves) {
      const nextMove = this._selectBestMove(move.board, nextPiece, null, depth + 1)
      if (nextMove) {
        move.next = nextMove
      }
      // if (depth == 0) {
      //   this.printMove(move)
      //   this.printMove(nextMove!)
      // }
      const score = nextMove?.score ?? move.score!
      if (score >= bestScore) {
        bestScore = score
        bestMove = move
      }
    }
    return bestMove
  }

  override selectBestMove(board: Board, piece: Piece, nextPiece: Piece): Move {
    console.clear()
    const bestMove = this._selectBestMove(board, piece, nextPiece, 0)
    if (bestMove === null) {
      throw new Error('No moves found')
    }
    return { x: bestMove.piece.x, dir: bestMove.piece.dir }
  }
}
