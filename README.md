## Heuristic agent

First I tried to understand the code and immediately noticed a bug in the agent:
in the `getPossibleMoves` function of the agent, piece object was being changed in the loop without cloning,
which resulted in the same direction for each piece in the moves list.

I tried fixing this bug, but got frustrated by bad code structure and inability to view variable types
and rewrote everything in TypeScript using classes and interfaces. So now there is a `Game` class and a `HeuristicAgent` class.

Then I spotted another bug: the agent was unable to place most pieces on the leftmost and rightmost columns.
This was due to incorrect piece size calculation. I fixed that by adding a `xOffset` parameter to piece type objects,
and trying to place piece while it fits instead of until x=width-piece.width.

Also, the column heights were calculated incorrectly, because the x and y loops were swapped.

Then I started to modify the algorithm. I wanted a better way to evaluate the algorithm, so I made a function to play
the game until the end using the algorithm and a custom random that can be seeded.
Then I played n games on n different seeds for each algorithm and calculate the average score.

Overall the initial algorithm with initial coefficients was very good and I couldn't do much to improve it.

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

Trying all piece types is very slow, so I tried to improve the algorithm with depth = 1.

It worked very well, achieving 1M+ on average for the same seeds.

## Running the game

Node.js & yarn are required

```
yarn
yarn dev
```
