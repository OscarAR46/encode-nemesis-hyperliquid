# NEMESIS - Overall Adds and Guidelines

## Comprehensive Bounty Implementation Roadmap

---

## Priority Order

| Priority | Bounty | Pool | Effort | Dependencies |
|----------|--------|------|--------|--------------|
| 1 | LI.FI | $6,500 | Medium | Wallet connection |
| 2 | Pear Protocol | $3,500 | Medium | Wallet connection |
| 3 | Valantis | $2,000 | High | Solidity, HyperEVM |
| 4 | Salt | $1,000 | Medium | Wallet connection |
| 5 | Insilico | $5,000 | High | Separate backend |

---

## 1. LI.FI Integration ($6,500 pool) - HIGHEST PRIORITY

### What Judges Want
- Pick origin chain + token → destination token on HyperEVM
- Use LI.FI SDK for swap + bridge in one flow
- Show route details (quote, ETA, steps, progress)
- Bonus: auto-deposit into Hyperliquid trading account

### Dependencies to Add

```bash
bun add @lifi/sdk viem @wagmi/core @walletconnect/web3-provider
```

### New Modules to Create

| File | Purpose |
|------|---------|
| `app/wallet.ts` | Real wallet connection (viem + wagmi) |
| `app/lifi.ts` | LI.FI SDK wrapper - quotes, routes, execution |
| `app/bridge-ui.ts` | Bridge modal/panel UI components |

### Key LI.FI SDK Methods

```typescript
import { getQuote, executeRoute, getStatus } from '@lifi/sdk'

// Get route quote
const quote = await getQuote({
  fromChain: 1,  // Ethereum
  toChain: 999,  // HyperEVM
  fromToken: '0xA0b86a...',  // USDC on ETH
  toToken: '0x...',  // USDC on HyperEVM
  fromAmount: '1000000000',
  fromAddress: userAddress,
})

// Execute with status tracking
const route = await executeRoute(quote, { updateCallback })
```

### UI Components to Build

1. Chain selector dropdown (source chain)
2. Token selector (source token)
3. Amount input
4. Destination preview (HyperEVM + destination token)
5. Route preview (steps, fees, ETA)
6. Execute button with progress states
7. Status tracking (pending → bridging → complete)

### Extra Credit Items

- Mobile-first design (CSS already responsive)
- Reusable component other teams can embed
- Auto-deposit: after bridging USDC, call Hyperliquid deposit contract

### Nemesis Dialogue Integration

```typescript
// Bridge started
"Initiating cross-chain transfer~ Hold tight..."

// Bridge in progress
"Your assets are traveling through the multiverse..."

// Bridge complete
"Ahh~ Your funds have arrived on HyperEVM! Ready to trade~"

// Bridge failed
"Something went wrong with the bridge... Let's try again."
```

---

## 2. Pear Protocol Integration ($3,500 pool)

### What Judges Want
- Execute real trades via Pear Execution API
- Pair trades: Long X / Short Y
- Basket trades: Long basket / Short ETH
- Conditional execution

### How It Fits Our UI

Current tabs can map to Pear functionality:
- **YES/NO** → Simple directional trades
- **Lobby** → Basket trades with friends
- **1v1 (Duel)** → Pair trades (Long A / Short B)

### Dependencies

```bash
bun add viem  # Already adding for LI.FI
```

### New Modules

| File | Purpose |
|------|---------|
| `app/pear.ts` | Pear API client - auth, quotes, execution |
| `app/pairs.ts` | Pair trade creation/management |
| `app/baskets.ts` | Basket composition and trading |

### Pear API Flow

```typescript
// 1. Authenticate - sign message with wallet
const signature = await signMessage({ message: authMessage })
const token = await pearAuth(signature, address, 'HLHackathon1')

// 2. Get quote for pair trade
const quote = await pearQuote({
  long: { asset: 'HYPE', size: 100 },
  short: { asset: 'ASTER', size: 100 },
})

// 3. Execute
const execution = await pearExecute(quote.id, token)
```

### UI Changes

- Replace mock order system with real Pear API calls
- Add pair selector (Asset A vs Asset B)
- Add basket builder (select multiple assets)
- Show real execution status from API
- Display P&L from actual positions

### ClientIDs Provided

Use: `HLHackathon1` through `HLHackathon10`

### API Resources

- Docs: https://docs.pearprotocol.io/api-integration/overview
- Auth: https://docs.pearprotocol.io/api-integration/access-management/authentication-process

---

## 3. Valantis Integration ($2,000 pool)

### What Judges Want
- AMM using spot order-book's mid/oracle price
- Dynamic fees for bid/ask
- Module for lending/Pendle PTs (yield on reserves)
- Module for order-book liquidity + hedging
- Use HyperEVM CoreWriter and Read precompiles
- API wallets for order execution

### Smart Contracts Needed

| Contract | Purpose |
|----------|---------|
| `NemesisAMM.sol` | Core AMM with oracle price reference |
| `YieldModule.sol` | Lend to HyperEVM markets or Pendle |
| `OrderBookModule.sol` | Place orders via API wallets |
| `interfaces/` | Valantis Sovereign Pool interfaces |

### Directory Structure

```
contracts/
├── src/
│   ├── NemesisAMM.sol
│   ├── YieldModule.sol
│   ├── OrderBookModule.sol
│   └── interfaces/
│       └── IValantisSovereignPool.sol
├── test/
├── script/
├── foundry.toml
└── README.md
```

### Key HyperEVM Precompiles

```solidity
// HyperCore Read precompile - get oracle prices
address constant HYPERCORE_READ = 0x0000000000000000000000000000000000000800;

// HyperCore Write precompile - execute orders
address constant HYPERCORE_WRITE = 0x0000000000000000000000000000000000000801;
```

### Recommended Approach

1. Fork Valantis Sovereign Pool as base layer
2. Add oracle price module using HyperCore Read precompile
3. Implement dynamic fee calculation based on volatility/spread
4. Create strategist role for reserve allocation
5. Build yield module for lending integration
6. Integrate API wallets for order-book execution

### Frontend Integration

- "Stake" section for LP provision
- Display current AMM prices vs oracle prices
- Show yield from modules
- Admin panel for strategist actions

### Resources

- Valantis Stake Exchange AMM (reference implementation)
- Valantis Sovereign Pool (base layer)
- Hyperliquid EVM docs for precompiles

---

## 4. Salt Integration ($1,000 pool)

### What Judges Want
- Policy-controlled accounts
- Automate capital on HyperEVM without custody
- Examples: trading bots, rebalancers, shared vaults

### Concept: Nemesis as Robo-Manager

The visual novel character becomes the AI agent:
- Users create "Trading Guilds" backed by Salt accounts
- Define policies: allowed assets, max trade sizes, strategies
- Nemesis executes within policy bounds
- Members maintain self-custody

### Dependencies

```bash
bun add salt-sdk  # Or use their API directly
```

### New Modules

| File | Purpose |
|------|---------|
| `app/salt.ts` | Salt SDK wrapper |
| `app/robo.ts` | Robo manager logic |
| `app/guild.ts` | Multi-user guild with Salt accounts |

### User Flow

1. User creates "Trading Guild" → deploys Salt policy-controlled account
2. Define rules:
   - Allowed assets: BTC, ETH, HYPE
   - Max position size: 10% of pool
   - Strategies: trend following, mean reversion
3. Members join by approving policy
4. Nemesis manages capital according to rules
5. Profits/losses distributed to members

### UI Components

- Guild creation wizard
- Policy definition form
- Member management
- Strategy selection
- Real-time position display

### Dialogue Integration

```typescript
// Guild created
"A new guild rises~ I shall serve as your faithful strategist."

// Trade executed
"Executing within your parameters... Position opened on HYPE."

// Policy violation attempted
"I cannot do that~ It violates the guild's sacred rules."
```

### Resources

- Salt SDK Documentation
- A-Z Building an Agent on Salt guide

---

## 5. Insilico Trade Ledger ($5,000 pool)

### What Judges Want
- Dockerized service
- Trade history API endpoints
- Position timeline reconstruction
- Cumulative PnL calculations
- Data ingestion from Hyperliquid public APIs
- Datasource abstraction for future swap to Insilico-HL

### This Is a Separate Backend Project

Does not share code with frontend, runs as independent service.

### Directory Structure

```
trade-ledger/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts           # Entry point
│   ├── ingestion/
│   │   ├── hyperliquid.ts # HL Info API client
│   │   └── websocket.ts   # Real-time updates
│   ├── api/
│   │   ├── routes.ts
│   │   └── handlers.ts
│   ├── db/
│   │   ├── schema.ts
│   │   └── queries.ts
│   ├── calculations/
│   │   ├── pnl.ts
│   │   └── timeline.ts
│   └── types.ts
├── test/
└── README.md
```

### Required API Endpoints

```
GET /trades/:address          # Trade history
GET /positions/:address       # Current positions
GET /positions/:address/history  # Position timeline
GET /pnl/:address            # Cumulative PnL
GET /pnl/:address/daily      # Daily PnL breakdown
GET /leaderboard             # Top traders
GET /leaderboard?builder=true # Builder-only filter
```

### Data Ingestion

```typescript
// Hyperliquid Info API
const HL_INFO_URL = 'https://api.hyperliquid.xyz/info'

// Get user fills
const fills = await fetch(HL_INFO_URL, {
  method: 'POST',
  body: JSON.stringify({
    type: 'userFills',
    user: address,
  })
})

// WebSocket for real-time
const ws = new WebSocket('wss://api.hyperliquid.xyz/ws')
ws.send(JSON.stringify({ method: 'subscribe', subscription: { type: 'fills', user: address } }))
```

### Datasource Abstraction

```typescript
interface DataSource {
  getFills(address: string): Promise<Fill[]>
  getPositions(address: string): Promise<Position[]>
  subscribe(address: string, callback: (event: Event) => void): void
}

class HyperliquidSource implements DataSource { ... }
class InsilicoSource implements DataSource { ... }  // Future swap
```

### Docker Configuration

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 3001
CMD ["bun", "run", "src/index.ts"]
```

### Frontend Integration

Once backend is running, update frontend:
- Leaderboard page → `GET /leaderboard`
- Portfolio page → `GET /pnl/:address`
- History tab → `GET /trades/:address`

---

## Team Parallelization

### Person A (Frontend + API Integrations)

1. Wallet connection (foundation)
2. LI.FI bridge UI + SDK
3. Pear API integration
4. Salt SDK for guilds
5. Frontend updates for real data

### Person B (Backend + Smart Contracts)

1. Insilico Trade Ledger service
2. Valantis smart contracts
3. HyperEVM deployment
4. API wallet integration

---

## Shared Dependencies

All bounties need wallet connection first:

```bash
bun add viem @wagmi/core @walletconnect/web3-provider
```

### Wallet Module (`app/wallet.ts`)

```typescript
import { createConfig, connect, disconnect, signMessage } from '@wagmi/core'
import { http } from 'viem'
import { mainnet, arbitrum } from 'viem/chains'

// HyperEVM chain config
const hyperEVM = {
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.hyperliquid.xyz/evm'] } },
}

export const config = createConfig({
  chains: [mainnet, arbitrum, hyperEVM],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [hyperEVM.id]: http(),
  },
})

export async function connectWallet() { ... }
export async function disconnectWallet() { ... }
export async function signAuthMessage(message: string) { ... }
```

---

## Nemesis Dialogue Categories to Add

For bounty integrations, add these dialogue categories:

```typescript
// app/dialogue.ts additions

bridge: [
  { text: "Initiating cross-chain transfer~ Hold tight...", emotion: 'inquisitive' },
  { text: "Your assets are traveling through the multiverse...", emotion: 'kawaii' },
],
bridgeComplete: [
  { text: "Ahh~ Your funds have arrived on HyperEVM!", emotion: 'excited' },
  { text: "Bridge successful! Ready to dominate~", emotion: 'pleased' },
],
bridgeFailed: [
  { text: "The bridge encountered turbulence... Let's try again.", emotion: 'concerned' },
],
pairTrade: [
  { text: "Long and short at once? Bold strategy~", emotion: 'sly' },
  { text: "Playing both sides... I like your style!", emotion: 'pleased' },
],
basketTrade: [
  { text: "Diversification is wise~ Spreading your bets.", emotion: 'talkative' },
],
guildCreated: [
  { text: "A new guild rises~ I shall serve as your strategist.", emotion: 'excited' },
],
guildTrade: [
  { text: "Executing within guild parameters...", emotion: 'inquisitive' },
],
stake: [
  { text: "Providing liquidity? You're helping the ecosystem~", emotion: 'happy' },
],
```

---

## Pre-Bounty Requirements

Before starting bounty implementations, complete these:

1. ✅ Dialogue system (exists)
2. ⬜ Pause/play/skip/autoplay controls
3. ⬜ Avatar on all tabs
4. ⬜ Tab-specific tutorial dialogue
5. ⬜ New game / returning player routes
6. ⬜ Cookie/cache for preferences
7. ⬜ Mobile responsive improvements
8. ⬜ Real wallet connection

---

## File Structure After All Bounties

```
encode-nemesis-hyperliquid/
├── app/
│   ├── index.ts
│   ├── state.ts
│   ├── render.ts
│   ├── events.ts
│   ├── types.ts
│   ├── dialogue.ts
│   ├── signal.ts
│   ├── audio.ts
│   ├── connection.ts
│   ├── utils.ts
│   ├── icons.ts
│   ├── wallet.ts          # NEW - wallet connection
│   ├── lifi.ts            # NEW - LI.FI SDK
│   ├── pear.ts            # NEW - Pear API
│   ├── salt.ts            # NEW - Salt SDK
│   ├── guild.ts           # NEW - guild management
│   └── storage.ts         # NEW - cookies/localStorage
├── contracts/             # NEW - Valantis
│   ├── src/
│   ├── test/
│   └── foundry.toml
├── trade-ledger/          # NEW - Insilico
│   ├── src/
│   ├── Dockerfile
│   └── docker-compose.yml
├── css/
├── nemesis-chan/
├── fonts/
├── documentation/
├── bounties/
├── PROMPT/
├── serve.dev.ts
├── serve.prod.ts
├── serve.shared.ts
├── flake.nix
├── package.json
└── README.md
```
