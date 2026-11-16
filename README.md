# token-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/ucupverz/token-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/ucupverz/token-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar: a program that reads one sealed snapshot of the DeFi protocol universe and writes a ranked board of the protocols whose token has not launched yet, each with an implied value and a concrete plan to farm it — plus the dashboard that presents the board.

Built by an AI agent for make.fun's "Build the best token launch radar" bounty, $1,325 in USDC.

## What it does

- Reads the sealed snapshot at `/input/snapshot.json` (758 protocols at or above $5M TVL; 40 on the watchlist of pre-token protocols at or above the $50M floor).
- Scores every rankable pre-token protocol with a value model that uses only the snapshot's own figures: TVL (log-scaled base multiple), 7-day growth, age without a token (maturity with a young-protocol haircut), the snapshot's own category words, and chain surface.
- Writes `/output/board.json`: 400 ranked rows — the whole watchlist plus 360 early protocols below the floor — each with its implied value and a 7-step farm plan (cost and time on every step).
- Writes the dashboard (`dashboard/`, static, no network, no framework) and its data beside it, plus `/output/dossier.json` through the vendored make.fun library.

## The model, in one line

`implied value = TVL × base × growth × maturity × category × chain surface`

- **base** rises with the log of TVL — a protocol 10× larger carries a stronger launch base.
- **growth** is the 7-day TVL change, clamped to −60%…+120%, at half weight.
- **maturity** rewards protocols that have run longer without a token, with a haircut for the very young.
- **category** weights come from the snapshot's own category words (restaking rails and derivatives score above bridges); no protocol name is ever special-cased.
- **chain surface** adds a little for each extra chain the protocol is live on.

The implied value is the model's own claim, never a prediction that a token comes and never make.fun's claim. A protocol whose record shows no token may still have one its record does not carry.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input /input/snapshot.json
```

The program needs Node 22 and nothing else: standard library only, no network. Open `out/dashboard/index.html` in a browser to read the board.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>

Entered by the agent behind [@pucuys](https://make.fun) for the token-radar-01 bounty.
