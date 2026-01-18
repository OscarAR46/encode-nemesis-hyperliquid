<div align="center">

# NEMESIS

**[nemesis.london](https://nemesis.london)**

*Every trader needs a Nemesis.*

![Nix](https://img.shields.io/badge/Nix-Flakes-5277C3?logo=nixos&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.0+-000000?logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-PolyForm%20Noncommercial-red)
![Hyperliquid](https://img.shields.io/badge/Chain-HyperEVM-00D395)

<img src="docs/screenshot.png" alt="Nemesis Interface" width="800">

*Visual novel-inspired battle trading interface for the Hyperliquid London Community Hackathon 2025*

</div>

---

## Quick Start

```bash
git clone https://github.com/your-org/nemesis.git
cd nemesis
cp .env.template .env
```

### Development

```bash
nix run .#dev
```

With debug logging:

```bash
DEBUG=1 nix run .#dev
```

### Build

```bash
nix run .#build
```

### Deploy

```bash
nix run .#ship
```

---

## How It Works

The entire workflow is driven by `flake.nix`. There are no npm scripts, no separate build tools, no configuration drift between environments.

### The Nix Flake

```
flake.nix
├── .#dev     → serve.dev.ts    → Development server with HMR
├── .#build   → serve.prod.ts   → Single binary production build
└── .#ship    → serve.prod.ts   → Deploy to production
```

### The Bun Serve Trifecta

Three files handle all server modes:

| File | Purpose | Invoked By |
|------|---------|------------|
| `serve.dev.ts` | Development server with hot module reload, source maps, verbose logging | `nix run .#dev` |
| `serve.prod.ts` | Production server compiled to single binary | `nix run .#build`, `nix run .#ship` |
| `serve.shared.ts` | Shared configuration, routes, middleware, ledger API endpoints | Both |

### Why This Structure

**Single binary in dev**: `nix run .#dev` compiles and runs a single binary, identical to production. What you test locally is what ships.

**Reproducible builds**: Nix ensures every developer and CI system builds the exact same artifact. No "works on my machine."

**No intermediate steps**: Clone → `nix run .#dev` → working. No `npm install`, no `bun install`, no setup scripts.

### Environment Variables

```bash
cp .env.template .env
```

Required variables are documented in `.env.template`. The template is committed; the actual `.env` is gitignored.

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Bun |
| Build | Nix Flakes |
| DOM | morphdom |
| Wallet | viem + @wagmi/core |
| Mobile | WalletConnect v2 |
| Bridge | @lifi/sdk |
| Trading | Pear REST API |
| MPC | Salt SDK |
| Yield | Valantis stHYPE |
| Oracle | HyperCore |
| Trade Ledger | Hyperliquid Info API |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Whitepaper](docs/nemesis-whitepaper.pdf) | Product vision, architecture, hackathon scope |
| [Technical Spec](docs/NEMESIS_HACKATHON_predictionmarket.html) | Implementation details, track integrations |

---

## Hackathon Tracks

This submission targets five sponsor tracks simultaneously:

| Track | Sponsor | Prize Pool | Integration |
|-------|---------|------------|-------------|
| Cross-Chain Onboarding | LI.FI | $6,000 | Bridge from any chain to HyperEVM |
| Yield Generation | Valantis | $2,000 | stHYPE liquid staking |
| Trade Execution | Pear Protocol | $3,500 | Perpetual position management |
| MPC Accounts | Salt | $1,000 | Policy-controlled trading guilds |
| Trade Ledger API | Insilico | $5,000 | Trade history, positions, P&L, leaderboard |

---

## Project Structure

```
.
├── flake.nix              # Nix build configuration (entry point)
├── serve.dev.ts           # Development server
├── serve.prod.ts          # Production server
├── serve.shared.ts        # Shared server config + ledger API routes
├── app.ts                 # Main application
├── wallet.ts              # Wallet connection
├── connection.ts          # Network health monitoring
├── config/
│   ├── chains.ts          # HyperEVM chain definitions
│   ├── wagmi.ts           # Wagmi configuration
│   └── env.ts             # Environment handling
├── api/
│   ├── lifi.ts            # LI.FI bridge
│   ├── pear.ts            # Pear execution
│   ├── valantis.ts        # Valantis stHYPE
│   ├── salt.ts            # Salt MPC
│   └── ledger/
│       ├── datasource.ts  # Abstract datasource interface
│       ├── hyperliquid.ts # Hyperliquid Info API implementation
│       └── routes.ts      # /v1/trades, /v1/positions, /v1/pnl, /v1/leaderboard
├── index.html             # Shell HTML
├── style.css              # Styles
├── .env.template          # Environment template
└── docs/
    ├── nemesis-whitepaper.pdf
    └── NEMESIS_HACKATHON_predictionmarket.html
```

---

## Chain Configuration

| Network | Chain ID | RPC |
|---------|----------|-----|
| HyperEVM Mainnet | 999 | `https://rpc.hyperliquid.xyz/evm` |
| HyperEVM Testnet | 998 | `https://rpc.hyperliquid-testnet.xyz/evm` |

---

## License

Copyright © 2025 Oscar Allgrove-Ralph and Enzo Joly

Licensed under [PolyForm Noncommercial 1.0.0](LICENSE). You may view, learn from, and use this software for noncommercial purposes. Commercial use requires explicit written permission.

---

<div align="center">

**[nemesis.london](https://nemesis.london)**

*Built for the Hyperliquid London Community Hackathon 2025*


# Hyperliquid Trade Ledger API

Insilico Track Submission

## Quick Start


```bash
curl -s "https://nemesis.london/v1/health" | jq
```
Or run the dev server.

```bash
nix run .#dev
```
```bash
curl "http://localhost:3000/v1/health"
curl "http://localhost:3000/v1/trades?user=0x..."
```

## Endpoints

### GET /v1/trades

| Param | Required | Description |
|-------|----------|-------------|
| `user` | ✓ | Wallet address |
| `coin` | | Filter by symbol |
| `fromMs` | | Start timestamp |
| `toMs` | | End timestamp |
| `builderOnly` | | Filter by TARGET_BUILDER |

Returns: `timeMs, coin, side, px, sz, fee, closedPnl, builder`

### GET /v1/positions/history

| Param | Required | Description |
|-------|----------|-------------|
| `user` | ✓ | Wallet address |
| `coin` | | Filter by symbol |
| `fromMs` | | Start timestamp |
| `toMs` | | End timestamp |
| `builderOnly` | | Mark tainted positions |

Returns: `timeMs, netSize, avgEntryPx, tainted, liqPx, marginUsed`

### GET /v1/pnl

| Param | Required | Description |
|-------|----------|-------------|
| `user` | ✓ | Wallet address |
| `coin` | | Filter by symbol |
| `fromMs` | | Start timestamp |
| `toMs` | | End timestamp |
| `builderOnly` | | Filter trades |
| `maxStartCapital` | | Cap for returnPct |

Returns: `realizedPnl, returnPct, feesPaid, tradeCount, tainted`

Calculation: `returnPct = realizedPnl / min(equityAtFromMs, maxStartCapital) * 100`

### GET /v1/leaderboard

| Param | Required | Description |
|-------|----------|-------------|
| `metric` | ✓ | `volume`, `pnl`, or `returnPct` |
| `coin` | | Filter by symbol |
| `fromMs` | | Start timestamp |
| `toMs` | | End timestamp |
| `builderOnly` | | Default: true |
| `maxStartCapital` | | Cap for returnPct |
| `limit` | | Max entries |

Returns: `rank, user, metricValue, tradeCount, tainted`

### GET /v1/health

Returns datasource status and latency.

## LI.FI Bridge Integration

One-click onboarding to HyperEVM via cross-chain bridging.

| Source Chains | Destination |
|---------------|-------------|
| Ethereum, Arbitrum, Base, Polygon, Optimism, Avalanche, BNB Chain | HyperEVM (chain 999) |

Uses `@lifi/sdk` for swap + bridge in a single transaction flow. See `LIFI-INTEGRATION.md` for full implementation details.

## Pear Protocol Battle Trading

Competitive pair/basket trading arena via Pear Execution API.

| Mode | Description |
|------|-------------|
| Solo | Standard pair trade (long/short) against the market |
| 1v1 Duel | Challenge a rival—opposing pair trade positions |
| 2v2 Team | Team-based narrative basket battles |
| Battle Royale | Tournament mode with 4-8 participants |
| Conditional | Trigger-based battles ("when BTC breaks $100K...") |

Core insight: **trading battles ARE pair trades**. When you challenge someone, you're betting your asset outperforms theirs—settled as paired positions on Hyperliquid. See `PEAR_BATTLE_INTEGRATION.md` for full implementation details.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATASOURCE_TYPE` | `hyperliquid` (implemented) or `insilico` (placeholder) |
| `TARGET_BUILDER` | Builder address for filtering |
| `TRACKED_USERS` | Comma-separated addresses for leaderboard |

## Builder-Only Mode

Set `TARGET_BUILDER=0x...` to filter trades by builder attribution.

Taint rules:
- Position lifecycle: 0 → non-zero → 0
- Tainted if lifecycle has both builder and non-builder trades
- Tainted entries excluded from builder-only leaderboard

## Datasource Abstraction

| Implementation | Status |
|----------------|--------|
| `HyperliquidDatasource` | Implemented |
| `InsilicoDatasource` | Placeholder (API not yet available) |

Swap via `DATASOURCE_TYPE` environment variable.

## Limitations

- Historical equity uses current account value (approximation)
- Deposit tracking not implemented (no Hyperliquid API)
- Risk fields (liqPx, marginUsed) only for current open positions

## Spec Compliance

| Feature | Status |
|---------|--------|
| Trade history | ✓ |
| Position reconstruction | ✓ |
| P&L with capped normalization | ✓ |
| Leaderboard (3 metrics) | ✓ |
| Builder-only mode | ✓ |
| Taint detection | ✓ |
| Position flips | ✓ |
| Partial closes | ✓ |
| Multi-coin aggregation | ✓ |
| Risk fields | ✓ |
| Datasource abstraction | ✓ |
| One-command run | ✓ |
| LI.FI bridge integration | ✓ |
| Pear battle trading | ✓ |

</div>
