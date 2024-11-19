import { eachblock, Piece } from './utils.ts'
import { Agent, Move } from './agent.ts'
import { Board } from './board.ts'

export class HeuristicAgent extends Agent {
  coefficients = {
    height: -0.58,
    completeLines: 0.76,
    holes: -0.36,
    bumpiness: -0.15,
  }

  private evaluateBoard(board: Board) {
    console.log('-'.repeat(20))
    console.log(board)

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
        // removeLine(board, y)
        completeLines++
      }
    }
    console.log('Complete lines:', completeLines)

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
    console.log(columnHeights)
    console.log('Aggregate height:', aggregateHeight)

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
    console.log('Holes:', holes)

    // Calculate bumpiness
    for (let x = 0; x < board.width - 1; x++) {
      bumpiness += Math.abs(columnHeights[x] - columnHeights[x + 1])
    }
    console.log('Bumpiness:', bumpiness)

    // Combine features into a heuristic score
    const score = (
      this.coefficients.height * aggregateHeight
      + this.coefficients.completeLines * completeLines
      + this.coefficients.holes * holes
      + this.coefficients.bumpiness * bumpiness
    )
    console.log('Score:', score)
    return score
  }


  private getPossibleMoves(board: Board, piece: Piece) {
    let moves = []
    // For each rotation of the piece
    for (let dir = 0; dir < 4; dir++) {
      // For each horizontal position
      for (let _x = 0; _x < board.width; _x++) {
        const x = _x - piece.type.xOffset[dir]
        const y = board.getDropPosition({ type: piece.type, x, dir })
        if (y === null) {
          continue
        }
        const newPiece = { type: piece.type, x, y, dir }
        const newBoard = board.clone()
        eachblock(newPiece, (x, y) => {
          newBoard.set(x, y, piece.type)
        })
        moves.push({ piece: newPiece, board: newBoard })
      }
    }
    return moves
  }

  override selectBestMove(board: Board, piece: Piece, nextPiece: Piece): Move {
    const moves = this.getPossibleMoves(board, piece)
    let bestMove = null
    let bestScore = -Infinity
    console.clear()
    for (const move of moves) {
      const score = this.evaluateBoard(move.board)
      if (score >= bestScore) {
        bestScore = score
        bestMove = move
      }
    }
    console.log(bestScore)
    console.log(bestMove)
    if (bestMove === null) {
      throw new Error('No moves found')
    }
    return { x: bestMove.piece.x, dir: bestMove.piece.dir }
  }
}
