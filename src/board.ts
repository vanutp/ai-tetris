import { eachblock, Piece, PieceType } from './utils.ts'


export class Board {
  readonly width: number
  readonly height: number
  private board: (PieceType | null)[][]

  constructor() {
    this.width = 10
    this.height = 20
    this.board = []
    this.clear()
  }

  /**
   * check if a piece can fit into a position in the grid
   */
  occupied(piece: Piece) {
    let result = false
    eachblock(piece, (x, y) => {
      if ((x < 0) || (x >= this.width) || (y < 0) || (y >= this.height) || this.get(x, y)) {
        result = true
      }
    })
    return result
  }

  unoccupied(piece: Piece) {
    return !this.occupied(piece)
  }

  removeLine(n: number) {
    for (let y = n; y >= 0; --y) {
      for (let x = 0; x < this.width; ++x) {
        this.board[x][y] = (y == 0) ? null : this.board[x][y - 1]
      }
    }
  }

  getDropPosition(piece: Omit<Piece, 'y'>) {
    let y = 0
    while (!this.occupied({ ...piece, y: y + 1 })) {
      y++
    }
    if (y === 0) {
      return null
    } else {
      return y
    }
  }

  clone(): Board {
    const res = new Board()
    res.board = structuredClone(this.board)
    return res
  }

  get(x: number, y: number): PieceType | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null
    } else {
      return this.board[x][y]
    }
  }

  set(x: number, y: number, piece: PieceType | null) {
    this.board[x][y] = piece
  }

  clear() {
    // const piec = PIECE_TYPES[0]
    // this.board = [
    //   [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    //   [null, null, null, null, null, null, null, null, null, null, null, null, null, piec, piec, piec, piec, piec, piec, piec],
    //   [null, null, null, null, null, piec, piec, null, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec],
    //   [null, null, null, null, null, null, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec],
    //   [null, null, null, null, null, null, null, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec],
    //   [null, null, null, null, null, null, null, piec, piec, null, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec],
    //   [null, null, null, null, null, null, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec],
    //   [null, null, null, null, null, null, null, null, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec, piec],
    //   [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, piec, piec, piec, piec, piec],
    //   [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
    // ]
    // return
    this.board = []
    for (let x = 0; x < this.width; x++) {
      this.board.push([])
      for (let y = 0; y < this.height; y++) {
        this.board[x].push(null)
      }
    }
  }

  print(hl: (x: number, y: number) => boolean) {
    let colors = []
    let res = []
    for (let y = 0; y < this.height; y++) {
      let curr = []
      for (let x = 0; x < this.width; x++) {
        if (hl(x, y) && this.board[x][y] != null) {
          colors.push('color:cyan;', 'color:default;')
          curr.push('%c█%c')
        } else if (this.board[x][y] != null) {
          curr.push('█')
        } else {
          curr.push('.')
        }
      }
      res.push(curr.join(''))
    }
    console.log(res.join('\n'), ...colors)
  }
}
