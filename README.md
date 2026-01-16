<div align="center">

# NEMESIS

*Every trader needs a Nemesis.*

**[nemesis.london](https://nemesis.london)**

![Nix](https://img.shields.io/badge/Nix-Flakes-5277C3?logo=nixos&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.0+-000000?logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-PolyForm%20Noncommercial-red)
![Hyperliquid](https://img.shields.io/badge/Chain-HyperEVM-00D395)

<img src="docs/screenshot.png" alt="Nemesis Interface" width="800">

*Visual novel-inspired battle trading interface for the Hyperliquid London Community Hackathon 2026*

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
| `serve.shared.ts` | Shared configuration to deduplicate common functionality, routes, middleware | Both |

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

---

## Documentation

| Document | Description |
|----------|-------------|
| [Whitepaper](docs/nemesis-whitepaper.pdf) | Product vision, architecture, hackathon scope |
| [Technical Spec](docs/NEMESIS_HACKATHON_predictionmarket.html) | Implementation details, track integrations |

---

## Hackathon Tracks

This submission targets four sponsor tracks simultaneously:

| Track | Sponsor | Prize Pool | Integration |
|-------|---------|------------|-------------|
| Cross-Chain Onboarding | LI.FI | $6,000 | Bridge from any chain to HyperEVM |
| Yield Generation | Valantis | $2,000 | stHYPE liquid staking |
| Trade Execution | Pear Protocol | $3,500 | Perpetual position management |
| MPC Accounts | Salt | $1,000 | Policy-controlled trading guilds |

---

---

## Chain Configuration

| Network | Chain ID | RPC |
|---------|----------|-----|
| HyperEVM Mainnet | 999 | `https://rpc.hyperliquid.xyz/evm` |
| HyperEVM Testnet | 998 | `https://rpc.hyperliquid-testnet.xyz/evm` |

---

## License

Copyright © 2026 Oscar Allgrove-Ralph, Enzo Joly & ENZOJOLY Ltd.

Licensed under [PolyForm Noncommercial 1.0.0](LICENSE). You may view, learn from, and use this software for noncommercial purposes. Commercial use requires explicit written permission.

---

<div align="center">

**[nemesis.london](https://nemesis.london)**

*Built for the Hyperliquid London Community Hackathon 2026*

</div>
