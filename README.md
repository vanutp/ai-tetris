## Heuristic agent

First I tried to understand the code and immediately noticed a bug in the agent:
in the `getPossibleMoves` function of the agent, piece object was being changed in the loop without cloning,
which resulted in the same direction for each piece in the moves list.

I tried fixing this bug, but got frustrated by bad code structure and inability to view types of variables
and rewrote everything in TypeScript using classes and interfaces. So now there is a `Game` class and a `HeuristicAgent` class.

Then I spotted another bug: the agent was unable to place most pieces on the leftmost and rightmost columns.
This was due to incorrect piece size calculation. I fixed the left margin by adding a `xOffset` parameter
(representing left offset in the 4x4 piece grid) to piece type objects, and fixed the right margin by trying to place
the piece while it fits, instead of placing it up to fixed x.

Also, the column height heuristic was calculated incorrectly, because the x and y loops were swapped.

Then I started to modify the algorithm. I wanted a better way to evaluate the algorithm, so I made a function to play
the game until the end using the algorithm and a custom random that can be seeded for reproducibility.
Then I played n games on n different seeds for each algorithm calculating the average score.

Overall the initial algorithm was very good and I couldn't do much to improve it.

Things that I tried and which didn't work:
- Implementing a heuristic that promotes leaving a 1-block hole (for placing a vertical block later)
- Actually removing complete lines from the board while evaluating the board

The only thing that somewhat improved the average score is slightly tweaking the coefficients.

The solution scores 181k on average for 10 seeds.

## Beam search

First I moved all board-related code to a separate class for ease of working with multiple field versions.

I implemented a beam search algorithm using recursion in the `BeamAgent` class.
The algorithm first tries to place the current piece in all possible positions and rotations,
then selects n best results and for each result calls itself with the next piece.
If the next piece is not available (recursion depth > 1), then it tries all possible piece types.

Trying all piece types is very slow, so I tried to evaluate and improve the algorithm with depth = 1.

It worked very well, achieving 1M+ on average for the same seeds.

Removing complete lines from the board while evaluating the board improved the score with this algorithm up to 2M+ on average.

## Running the game

Node.js & yarn are required

```
yarn
yarn dev
```

To run one game until the end, press space, then F. To run 10 games, click the "Test seeds" button.
