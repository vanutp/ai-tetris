import { Action, Direction, eachblock, get, hide, Piece, PIECE_TYPES, PieceType, show, text, timestamp } from './utils.ts'
import { HeuristicAgent } from './heuristic_agent.ts'
import { Random } from './random.ts'
import { Board } from './board.ts'
import { BeamAgent } from './beam_agent.ts'

const SPEED = { start: 0.6, decrement: 0.005, min: 0.1 }  // how long before piece drops by 1 row (seconds)

export class Game {
  private readonly canvas = get('canvas') as HTMLCanvasElement
  private readonly ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
  private readonly ucanvas = get('upcoming') as HTMLCanvasElement
  private readonly uctx = this.ucanvas.getContext('2d') as CanvasRenderingContext2D
  public readonly width = 10  // width of the board in blocks
  public readonly height = 20  // height of the board in blocks
  private readonly nu = 5  // width/height of upcoming preview in blocks

  readonly agent = new BeamAgent()
  private ffPromise: Promise<void> | null = null

  // pixel size of a single tetris block
  private dx = 1
  private dy = 1
  private isPlaying = false
  private actionsQueue: Action[] = []
  private timeSinceDrop = 0
  private piecesBag: PieceType[] = []
  private invalid = {
    board: false,
    next: false,
    score: false,
    rowCount: false,
  }

  private readonly board = new Board()

  private _rowCount = 0
  get rowCount(): number {
    return this._rowCount
  }

  set rowCount(value: number) {
    this._rowCount = value
    this.invalidateRows()
  }

  get timePerDrop(): number {
    return Math.max(SPEED.min, SPEED.start - (SPEED.decrement * this.rowCount))
  }

  private _current: Piece = this.randomPiece()
  get current() {
    return this._current
  }

  set current(piece: Piece) {
    this._current = piece
    this.invalidate()
  }

  private _next: Piece = this.randomPiece()
  get next() {
    return this._next
  }

  set next(piece: Piece) {
    this._next = piece
    this.invalidateNext()
  }

  private _score = 0
  get score() {
    return this._score
  }

  set score(value: number) {
    this._score = value
    this._visualScore = value
    this.invalidateScore()
  }

  private _visualScore = 0
  get visualScore() {
    return this._visualScore
  }

  set visualScore(value: number) {
    this._visualScore = value
    this.invalidateScore()
  }


  /**
   * start with 4 instances of each piece and
   * pick randomly until the 'bag is empty'
   */
  randomPiece() {
    if (this.piecesBag.length === 0) {
      for (const piece of PIECE_TYPES) {
        for (let i = 0; i < 4; i++) {
          this.piecesBag.push(piece)
        }
      }
    }
    const type = this.piecesBag.splice(Random.randint(0, this.piecesBag.length - 1), 1)[0]
    return { type, dir: Direction.UP, x: Math.round(Random.randint(0, this.width - type.size)), y: 0 }
  }


  resize() {
    this.canvas.width = this.canvas.clientWidth  // set canvas logical size equal to its physical size
    this.canvas.height = this.canvas.clientHeight
    this.ucanvas.width = this.ucanvas.clientWidth
    this.ucanvas.height = this.ucanvas.clientHeight
    this.dx = this.canvas.width / this.width
    this.dy = this.canvas.height / this.height
    this.invalidate()
    this.invalidateNext()
  }

  run() {
    this.addEvents() // attach keydown and resize events

    let now = timestamp()
    let last = now

    let frame = async () => {
      if (this.ffPromise) {
        await this.ffPromise
        last = timestamp()
      }
      now = timestamp()
      await this.update(Math.min(1, (now - last) / 1000.0)) // using requestAnimationFrame have to be able
      // to handle large delta's caused when it 'hibernates' in a background or non-visible tab
      this.draw()
      last = now
      requestAnimationFrame(frame)
    }

    this.resize()
    this.reset()
    frame().then()
  }

  addEvents() {
    document.addEventListener('keydown', this.onKeydown.bind(this), false)
    window.addEventListener('resize', this.resize.bind(this), false)
  }

  onKeydown(ev: KeyboardEvent) {
    let handled = false
    if (this.isPlaying) {
      switch (ev.code) {
        case 'ArrowLeft':
          this.actionsQueue.push(Action.LEFT)
          handled = true
          break
        case 'ArrowRight':
          this.actionsQueue.push(Action.RIGHT)
          handled = true
          break
        case 'ArrowUp':
          this.actionsQueue.push(Action.UP)
          handled = true
          break
        case 'ArrowDown':
          this.actionsQueue.push(Action.DOWN)
          handled = true
          break
        case 'Escape':
          this.lose()
          handled = true
          break
        case 'Space':
          this.actionsQueue.push(Action.AI)
          handled = true
          break
        case 'KeyF':
          this.actionsQueue.push(Action.FAST_FORWARD)
          handled = true
          break
      }
    } else if (ev.code == 'Space') {
      this.play()
      handled = true
    }
    if (handled) {
      ev.preventDefault()
    }
  }


  play() {
    hide('start')
    this.reset()
    this.isPlaying = true
  }

  lose() {
    show('start')
    this.visualScore = this.score
    this.isPlaying = false
  }

  setBlock(x: number, y: number, type: PieceType | null) {
    this.board.set(x, y, type)
    this.invalidate()
  }

  reset() {
    Random.reset()
    this.timeSinceDrop = 0
    this.actionsQueue = []
    this.piecesBag = []
    this.board.clear()
    this.rowCount = 0
    this.score = 0
    this.current = this.randomPiece()
    this.next = this.randomPiece()
  }

  async update(elapsedTime: number) {
    if (this.isPlaying) {
      if (this.visualScore < this.score) {
        this.visualScore++
      }
      if (this.actionsQueue.length > 0) {
        await this.handleAction(this.actionsQueue.shift()!)
      }
      this.timeSinceDrop += elapsedTime
      if (this.timeSinceDrop > this.timePerDrop) {
        this.timeSinceDrop -= this.timePerDrop
        // drop()
      }
    }
  }

  async handleAction(action: Action) {
    switch (action) {
      case Action.LEFT:
      case Action.RIGHT:
        this.move(action)
        break
      case Action.UP:
        this.rotate()
        break
      case Action.DOWN:
        this.drop()
        break
      case Action.AI:
        this.agentMove()
        break
      case Action.FAST_FORWARD:
        this.fastForward().then()
        break
    }
  }

  move(act: Action) {
    let x = this.current.x
    let y = this.current.y
    switch (act) {
      case Action.RIGHT:
        x += 1
        break
      case Action.LEFT:
        x -= 1
        break
      case Action.DOWN:
        y += 1
        break
    }
    if (this.board.unoccupied({ type: this.current.type, x, y, dir: this.current.dir })) {
      this.current.x = x
      this.current.y = y
      this.invalidate()
      return true
    } else {
      return false
    }
  }

  rotate() {
    const newdir = (this.current.dir == Direction.MAX ? Direction.MIN : this.current.dir + 1)
    if (this.board.unoccupied({ ...this.current, dir: newdir })) {
      this.current.dir = newdir
      this.invalidate()
    }
  }

  drop() {
    if (!this.move(Action.DOWN)) {
      this.score += 10
      eachblock(this.current, (x, y) => {
        this.setBlock(x, y, this.current.type)
      })
      this.removeLines()
      this.current = this.next
      this.next = this.randomPiece()
      this.actionsQueue = []
      if (this.board.occupied(this.current)) {
        this.lose()
      }
    }
  }

  removeLines() {
    let n = 0
    for (let y = this.height - 1; y >= 0; --y) {
      let complete = true
      for (let x = 0; x < this.width; ++x) {
        if (!this.board.get(x, y)) {
          complete = false
          break
        }
      }
      if (complete) {
        this.board.removeLine(y)
        y++ // recheck same line
        n++
        this.invalidate()
      }
    }
    if (n > 0) {
      this.rowCount += n
      this.score += 100 * Math.pow(2, n - 1) // 1: 100, 2: 200, 3: 400, 4: 800
    }
  }

  // region Rendering
  invalidate() {
    this.invalid.board = true
  }

  invalidateNext() {
    this.invalid.next = true
  }

  invalidateScore() {
    this.invalid.score = true
  }

  invalidateRows() {
    this.invalid.rowCount = true
  }

  draw() {
    this.ctx.save()
    this.ctx.lineWidth = 1
    this.ctx.translate(0.5, 0.5) // for crisp 1px black lines
    this.drawBoard()
    this.drawNext()
    this.drawScore()
    this.drawRowCount()
    this.ctx.restore()
  }

  drawBoard() {
    if (!this.invalid.board) {
      return
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    if (this.isPlaying) {
      this.drawPiece(this.ctx, this.current)
    }
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let block = this.board.get(x, y)
        if (block) {
          this.drawBlock(this.ctx, x, y, block.color)
        }
      }
    }
    this.ctx.strokeRect(0, 0, this.width * this.dx - 1, this.height * this.dy - 1) // board boundary
    this.invalid.board = false
  }

  drawNext() {
    if (!this.invalid.next) {
      return
    }
    const padding = (this.nu - this.next.type.size) / 2
    this.uctx.save()
    this.uctx.translate(0.5, 0.5)
    this.uctx.clearRect(0, 0, this.nu * this.dx, this.nu * this.dy)
    this.drawPiece(this.uctx, { type: this.next.type, x: padding, y: padding, dir: this.next.dir })
    this.uctx.strokeStyle = 'black'
    this.uctx.strokeRect(0, 0, this.nu * this.dx - 1, this.nu * this.dy - 1)
    this.uctx.restore()
    this.invalid.next = false
  }

  drawScore() {
    if (!this.invalid.score) {
      return
    }
    text('score', (Math.floor(this.visualScore)).toString().padStart(6, '0'))
    this.invalid.score = false
  }

  drawRowCount() {
    if (!this.invalid.rowCount) {
      return
    }
    get('rows').innerText = this.rowCount.toString()
    this.invalid.rowCount = false
  }

  drawPiece(ctx: CanvasRenderingContext2D, piece: Piece) {
    eachblock(piece, (x, y) => {
      this.drawBlock(ctx, x, y, piece.type.color)
    })
  }

  drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.fillStyle = color
    ctx.fillRect(x * this.dx, y * this.dy, this.dx, this.dy)
    ctx.strokeRect(x * this.dx, y * this.dy, this.dx, this.dy)
  }


  // endregion

  agentMove() {
    let bestMove = this.agent.selectBestMove(this.board.clone(), this.current, this.next)
    if (bestMove) {
      let dropY = this.board.getDropPosition({ type: this.current.type, x: bestMove.x, dir: bestMove.dir })
      if (dropY === null) {
        throw new Error('dropY is null')
      }
      console.log('DropY:', dropY)
      this.current.x = bestMove.x
      this.current.y = dropY
      this.current.dir = bestMove.dir
      this.drop()
    }
  }

  async fastForward() {
    this.ffPromise = new Promise<void>(resolve => {
      let f = () => {
        if (this.isPlaying) {
          this.agentMove()
          this.draw()
          setTimeout(f, 0)
        } else {
          resolve()
        }
      }
      setTimeout(f, 0)
    })
    await this.ffPromise
    this.ffPromise = null
  }
}


