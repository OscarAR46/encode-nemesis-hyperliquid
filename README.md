# prealpha

Binary options trading interface for crypto price predictions. Users take positions on discrete price outcomes with fixed expiry. Settlement is trustless via oracle.

Built for the Hyperliquid x Pear Protocol hackathon.

## Architecture

VYZN abstracts leveraged perpetual trading into simple binary predictions. Under the hood, positions are executed via SYMMIO's solver network through Pear Protocol.

```
User Interface          Execution Layer         Settlement
     |                       |                      |
  YES / NO    --->    Solver RFQ     --->    Pyth Oracle
  1v1 / COOP          (SYMMIO)               HyperEVM
                           |
                     Bilateral Escrow
                      (HyperEVM)
```

### Why SYMMIO Over CLOB or AMM

Three liquidity mechanisms were evaluated:

| Mechanism | Pros | Cons |
|-----------|------|------|
| CLOB | Price discovery, capital efficiency | Requires active market makers posting resting orders |
| AMM | Always-on liquidity | Slippage on size, LP impermanent loss, needs bootstrap capital |
| SYMMIO RFQ | Instant fills, no bootstrap, solvers hedge externally | Depends on solver availability |

SYMMIO was chosen because:

1. Solvers quote on demand rather than committing resting capital
2. Solvers hedge their exposure on existing liquid venues (Hyperliquid, Binance)
3. No liquidity bootstrapping required at launch
4. Bilateral escrow model aligns with peer-to-peer trade types

### How Solver Execution Works

1. User expresses intent: market, side, stake amount
2. Backend requests quote from SYMMIO solver network via Pear API
3. Solver returns price and locks collateral commitment
4. User accepts; both parties deposit to bilateral escrow on HyperEVM
5. At expiry, Pyth oracle reports price; contract settles automatically

The solver manages their own hedging. If they sell YES on "ETH > 3500", they buy ETH perps on Hyperliquid to delta hedge. Their risk management is external to the protocol.

## Trade Types

### Standard (YES / NO)

User takes a directional position against the solver network.

- YES: Pays out if condition is true at expiry
- NO: Pays out if condition is false at expiry

Pricing follows binary option mechanics. A YES priced at 0.40 implies 40% probability; if correct, user receives 1.00 per share (2.5x return on stake).

### Challenge (1v1)

Peer-to-peer adversarial bet. One user creates a challenge, another accepts the opposite side.

```
Alice: "ETH > 3500 by Friday" - stakes $100 on YES
Bob: accepts - stakes $100 on NO
Winner takes $200 (minus protocol fee)
```

No solver involved. Pure escrow between two wallets. Settlement via same oracle mechanism.

### Cooperative (COOP)

Synchronized entry where two users take the same position together.

```
Alice: "ETH > 3500 by Friday" - stakes $100 on YES, invites Bob
Bob: accepts invite - stakes $100 on YES
Both positions open atomically in same block
```

Use cases:
- Social trading with friends
- Synchronized entry for trading groups
- Removing execution timing mismatch

## Smart Contract Architecture

Three contract types required:

### 1. Solver Escrow

Bilateral agreement between user and solver. Adapted from SYMMIO's existing audited contracts.

```
deposit(user, solver, collateral)
settle(oraclePrice, strike, expiry)
liquidate(party) // if margin insufficient
```

### 2. Peer Escrow (1v1)

Simple two-party lockup.

```
create(market, side, stake, expiry) -> challengeId
accept(challengeId) // counterparty deposits opposite stake
settle(challengeId, oraclePrice)
cancel(challengeId) // before acceptance only
```

### 3. Coop Escrow

Multi-party synchronized entry.

```
create(market, side, stake, invitee) -> inviteId
accept(inviteId) // invitee deposits matching stake
execute(inviteId) // both positions open via solver
```

## Oracle Integration

Settlement requires trusted price at expiry. Pyth Network provides:

- Sub-second price updates across 350+ assets
- Pull-based oracle (user submits proof with settlement tx)
- Native Hyperliquid integration

Settlement flow:

```
1. Expiry timestamp reached
2. Keeper (or user) fetches Pyth price attestation
3. Submit settlement tx with price proof
4. Contract validates proof, determines winner
5. Collateral released to winner
```

## Development

### Prerequisites

- Nix (for reproducible environment)
- Or: Bun 1.0+ installed directly

### Run

```
nix develop
bun serve.ts
```

Server runs at localhost:3000. Edit app.ts, refresh browser.

### Structure

```
.
├── index.html      Page shell
├── style.css       Styles
├── app.ts          Application logic (bundled on request)
├── serve.ts        Dev server with transparent TS bundling
├── flake.nix       Nix environment (provides Bun)
└── flake.lock      Pinned Nix dependencies
```

No package.json or node_modules. Bun handles TypeScript natively. The serve.ts intercepts requests for app.js and bundles app.ts on-the-fly.

### Adding Dependencies

If npm packages become necessary:

```
bun add <package>
```

This creates package.json and bun.lock. Commit both.

## Integration Roadmap

### Phase 1: Wallet Connection

- wagmi/viem for wallet connect
- Support MetaMask, WalletConnect, Coinbase Wallet
- Read user address and balance

### Phase 2: Price Feeds

- Pyth WebSocket for live prices
- Replace mock price updates with real data
- Display confidence intervals

### Phase 3: Solver Integration

- Pear Protocol API for RFQ
- Quote request and acceptance flow
- Position tracking via API

### Phase 4: Contract Deployment

- Deploy escrow contracts to HyperEVM
- Integrate settlement with Pyth
- Keeper service for automated settlement

### Phase 5: Social Features

- On-chain challenge creation and acceptance
- Invite links for coop trades
- Leaderboard from on-chain data

## Binary Option Pricing Reference

For a binary option (digital call):

```
P(YES) = N(d1)

where:
d1 = (ln(S/K) + (r + sigma^2/2) * T) / (sigma * sqrt(T))

S = current price
K = strike price
sigma = implied volatility
T = time to expiry (years)
r = risk-free rate
N = cumulative normal distribution
```

Solvers use this (or proprietary models) to price quotes. The protocol does not enforce pricing; market forces and arbitrage align prices to fair value.

## Fee Structure

To be determined. Likely:

- Protocol fee: 1-2% of winning payout
- Solver spread: embedded in quote (solver's edge)
- No fee on peer-to-peer until settlement

## Security Considerations

- Escrow contracts hold user funds; require audit before mainnet
- Oracle manipulation risk mitigated by Pyth's attestation model
- Solver counterparty risk eliminated by bilateral collateral lockup
- Front-running mitigated by RFQ model (no public mempool orders)

## References

- SYMMIO Documentation: https://docs.symm.io
- Pear Protocol: https://docs.pear.garden
- Hyperliquid: https://hyperliquid.gitbook.io
- Pyth Network: https://docs.pyth.network
