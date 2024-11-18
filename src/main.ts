import { Game } from './game.ts'
import { sleep, text } from './utils.ts'
import { Random } from './random.ts'

const game = new Game()
game.run()

function rndCoeff() {
  return Number((Math.random()).toFixed(3))
}
//
// async function findBestCoeff() {
//   let bestCoeff = {...game.agent.coefficients}
//   text('bestCoeff', Object.values(bestCoeff))
//   let bestScore = 0
//   while (true) {
//     await sleep(1000)
//     game.agent.coefficients = {
//       height: -rndCoeff(),
//       completeLines: rndCoeff(),
//       holes: -rndCoeff(),
//       bumpiness: -rndCoeff(),
//     }
//     text('currCoeff', game.agent.coefficients)
//     let scores = []
//     for (let i = 0; i < 5; i++) {
//       game.play()
//       await game.fastForward()
//       scores.push(game.score)
//     }
//     let medianScore = scores.sort()[Math.floor(scores.length / 2)]
//     if (medianScore > bestScore) {
//       bestScore = medianScore
//       text('bestScore', bestScore)
//       bestCoeff = {...game.agent.coefficients}
//       text('bestCoeff', Object.values(bestCoeff))
//     }
//   }
// }

// await findBestCoeff()

async function testSeeds() {
  let scores = []
  for (let seed = 0; seed < 10; seed++) {
    await sleep(3000)
    text('gameno', `${seed + 1}/10`)
    Random.seed = seed
    game.play()
    await game.fastForward()
    scores.push(game.score)
    text('avgScore', scores.reduce((a, b) => a + b) / scores.length)
  }
}

document.getElementById('runTest')!.addEventListener('click', testSeeds)
