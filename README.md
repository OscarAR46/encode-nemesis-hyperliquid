# Hyperliquid Trade Ledger API

Insilico Track Submission

## Quick Start

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
