<![CDATA[# 💣 Minesweeper ZK

> **Provably fair, competitive Minesweeper with zero-knowledge proofs on Stellar.**
>
> Built for the **Stellar Hacks: ZK Gaming Hackathon** by DoraHacks.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://minesweeper-zk.vercel.app)
[![Smart Contract](https://img.shields.io/badge/Contract-Stellar%20Testnet-blue?style=for-the-badge&logo=stellar)](https://stellar.expert/explorer/testnet/contract/CAYB7VTINJMINQVZZIUAOLESAGUWJTRD24VBTY5YHNKONC5ZP5CH2BHT)
[![Game Hub](https://img.shields.io/badge/Game%20Hub-Integrated-green?style=for-the-badge)](https://stellar.expert/explorer/testnet/contract/CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG)

---

## 📺 Demo Video

> **[▶️ Watch the Demo on YouTube](https://youtube.com)** *(Replace with your actual link after uploading)*

---

## 🎯 The Problem

Minesweeper is a game built on **hidden information** — knowing where the mines are means you've already won. But blockchains are **transparent by design**. Every piece of data stored in a smart contract is publicly readable.

If you store a Minesweeper board on-chain, anyone can open a block explorer, read the contract state, and see exactly where every mine is. **The game is broken before it starts.**

## 💡 The Solution

Minesweeper ZK solves this with **zero-knowledge proofs**:

1. Both players commit a random seed → combined into a **shared deterministic seed**
2. The board is generated **locally in each player's browser** from that seed (never stored on-chain)
3. Players play the game entirely client-side
4. When finished, the **o1js ZK circuit** generates a cryptographic proof that the player's moves are valid against the hidden board
5. Only the **proof** (not the board) is submitted to the Soroban smart contract
6. The contract verifies the proof mathematically and releases the XLM prize to the winner

**Result:** Provably fair gameplay with hidden information on a fully transparent blockchain.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                  │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Freighter │  │  Game Engine  │  │  o1js ZK Circuit  │  │
│  │  Wallet   │  │  (Seed →     │  │  (Moves + Seed →  │  │
│  │ Connect   │  │   Board →    │  │   Proof)          │  │
│  │           │  │   Gameplay)  │  │                   │  │
│  └─────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
│        │               │                   │             │
│        ▼               ▼                   ▼             │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Firebase Realtime DB                   │ │
│  │         (Matchmaking & Room Signaling)              │ │
│  └─────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│               STELLAR TESTNET (Soroban)                 │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          Minesweeper ZK Contract                    │ │
│  │  • create_game() → escrow XLM bet                   │ │
│  │  • join_game()   → match bet + call Hub start_game  │ │
│  │  • submit_score()→ verify ZK proof                  │ │
│  │  • reveal_winner()→ pay winner + call Hub end_game  │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │ cross-contract calls           │
│  ┌──────────────────────▼──────────────────────────────┐ │
│  │       DoraHacks Game Hub (Mock Contract)            │ │
│  │  • start_game() ← called when Player 2 joins       │ │
│  │  • end_game()   ← called when winner is decided     │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔗 Live Deployments

| Component | Link |
|-----------|------|
| **Frontend** | [minesweeper-zk.vercel.app](https://minesweeper-zk.vercel.app) |
| **Minesweeper Contract** | [`CAYB7VT...2BHT`](https://stellar.expert/explorer/testnet/contract/CAYB7VTINJMINQVZZIUAOLESAGUWJTRD24VBTY5YHNKONC5ZP5CH2BHT) |
| **Game Hub Contract** | [`CB4VZA...EMYG`](https://stellar.expert/explorer/testnet/contract/CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG) |
| **Network** | Stellar Testnet |

---

## 🎮 How It Works

### Game Flow

```
Player 1                          Player 2
   │                                 │
   ├── Connect Freighter Wallet      ├── Connect Freighter Wallet
   ├── Create Room (bet 10 XLM) ──►  │
   │   └── create_game() on-chain    ├── Join Room (match 10 XLM)
   │                                 │   └── join_game() on-chain
   │                                 │       └── Hub.start_game() ✓
   │                                 │
   ├── Commit random seed            ├── Commit random seed
   │   └── Seeds combined → board    │   └── Same board generated
   │                                 │
   ├── Play Minesweeper locally      ├── Play Minesweeper locally
   │   └── Click tiles, flag mines   │   └── Click tiles, flag mines
   │                                 │
   ├── Game ends → generate ZK proof ├── Game ends → generate ZK proof
   │   └── submit_score() on-chain   │   └── submit_score() on-chain
   │                                 │
   └── reveal_winner() on-chain ─────┘
       ├── Verify proofs
       ├── Transfer 20 XLM to winner
       └── Hub.end_game() ✓
```

### Seed Commitment Protocol

To ensure fairness, neither player can control the board:

1. **Player 1** generates a random string and commits its hash
2. **Player 2** generates a random string and commits its hash
3. Both seeds are revealed and combined: `finalSeed = hash(seed1 + seed2)`
4. The same `finalSeed` generates the **identical board** for both players
5. Neither player could have predicted or manipulated the board

### ZK Proof Generation

When a player finishes, the o1js circuit proves:

| Input (Private) | Output (Public) |
|---|---|
| Mine positions (from seed) | ✅ Score is valid |
| Sequence of clicks | ✅ No mines were hit |
| Board state after each move | ✅ Rules were followed |

The verifier (smart contract) only sees the **public outputs** — never the private inputs. The mine positions are never revealed on-chain.

---

## 📊 Scoring System

| Parameter | Value |
|-----------|-------|
| Grid Size | 8 × 8 (64 cells) |
| Total Mines | 10 |
| Safe Cells | 54 |
| Max Score | 1,000 |

| Action | Formula | Max Points |
|--------|---------|-----------|
| Revealing safe cells | `(revealed / 54) × 100 × 5` | 500 |
| Correctly flagging mines | `(correct flags / 10) × 100 × 5` | 500 |
| Wrong flag penalty | `-50 per wrong flag` | — |

**Winner = highest score. Ties go to faster completion time.**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| **ZK Proofs** | o1js (client-side proof generation) |
| **Wallet** | Freighter Browser Extension |
| **Smart Contract** | Rust + Soroban SDK |
| **Blockchain** | Stellar Testnet |
| **Matchmaking** | Firebase Realtime Database |
| **Deployment** | Vercel (frontend), Stellar CLI (contract) |
| **State Management** | Zustand |

---

## 📁 Project Structure

```
MinesweeperZK/
├── frontend/                    # Next.js application
│   ├── app/                     # App router (page.tsx = main SPA)
│   ├── components/
│   │   ├── game/                # MinesweeperZkGame, GameBoard, GameCell
│   │   ├── multiplayer/         # CommitRevealPage, SeedCommit
│   │   ├── ui/                  # Reusable UI components (shadcn/ui)
│   │   ├── zk-proof-display.tsx # ZK proof verification animation
│   │   ├── lobby-page.tsx       # Room browser with filters
│   │   └── summary-verdict.tsx  # Post-game results screen
│   ├── hooks/
│   │   ├── use-minesweeper-game.ts  # Core game state orchestrator
│   │   ├── use-firebase-room.ts     # Room CRUD & real-time sync
│   │   ├── use-firebase-game.ts     # In-game state sync
│   │   └── use-contract-game.ts     # Soroban contract interactions
│   ├── lib/
│   │   ├── game/
│   │   │   ├── minesweeper.ts   # Deterministic board generation (seeded PRNG)
│   │   │   ├── store.ts         # Zustand game state store
│   │   │   └── types.ts         # All TypeScript types + GAME_CONFIG
│   │   ├── stellar/
│   │   │   ├── client.ts        # Freighter wallet + dev wallet manager
│   │   │   └── interactions.ts  # Soroban transaction builder & submitter
│   │   ├── zk/
│   │   │   ├── proof-generator.ts  # ZK proof generation (o1js)
│   │   │   └── mock-proof.ts       # Mock proof for demo fallback
│   │   └── firebase/
│   │       └── client.ts        # Firebase app initialization
│   └── package.json
│
├── smart-contract/              # Soroban smart contracts (Rust)
│   └── contracts/
│       └── minesweeper-zk/
│           └── src/
│               └── lib.rs       # Main contract (create/join/submit/reveal)
│
├── DEMO_SCRIPT.md               # Demo video script
├── SCORING.md                   # Scoring system documentation
└── README.md                    # This file
```

---

## 🚀 Local Development Setup

### Prerequisites

- **Node.js** ≥ 18
- **Rust** + `wasm32-unknown-unknown` target
- **Stellar CLI** (`stellar` / `soroban`)
- **Freighter** browser extension

### 1. Clone & Install

```bash
git clone https://github.com/Nathasan1410/MinesweeperZK.git
cd MinesweeperZK/frontend
npm install
```

### 2. Environment Variables

Create `frontend/.env.local`:

```env
NODE_ENV=development

# Firebase (Realtime Database for matchmaking)
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_url
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stellar
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_GAME_HUB_CONTRACT=CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG
NEXT_PUBLIC_MINESWEEPER_CONTRACT=CAYB7VTINJMINQVZZIUAOLESAGUWJTRD24VBTY5YHNKONC5ZP5CH2BHT

# Game Config
NEXT_PUBLIC_MAX_BET_AMOUNT=1000
NEXT_PUBLIC_MIN_BET_AMOUNT=1
NEXT_PUBLIC_GAME_TIMEOUT_MINUTES=15
NEXT_PUBLIC_ENABLE_DEV_WALLET=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### 3. Run

```bash
npm run dev
# Open http://localhost:3000
```

### 4. Build Smart Contract (Optional)

```bash
cd smart-contract/contracts/minesweeper-zk
cargo build --target wasm32-unknown-unknown --release
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/minesweeper_zk.wasm \
  --source YOUR_SECRET_KEY \
  --network testnet
```

---

## ✅ Hackathon Requirements Checklist

| # | Requirement | Status | Details |
|---|-------------|--------|---------|
| 1 | ZK-powered game mechanic | ✅ | o1js proves board solutions without revealing mine positions |
| 2 | Deployed on Stellar Testnet | ✅ | Contract `CAYB7VT...2BHT` live on testnet |
| 3 | `start_game()` call to Game Hub | ✅ | Cross-contract call in `join_game()` when Player 2 joins |
| 4 | `end_game()` call to Game Hub | ✅ | Cross-contract call in `reveal_winner()` when winner is decided |
| 5 | Functional frontend | ✅ | Live at [minesweeper-zk.vercel.app](https://minesweeper-zk.vercel.app) |
| 6 | Open-source repository | ✅ | This GitHub repo |
| 7 | Demo video | ✅ | [YouTube link](https://youtube.com) *(update after upload)* |

---

## 🔐 Smart Contract Functions

### `create_game(player1, bet_amount) → session_id`
Creates a new game session and escrows the bet.

### `join_game(session_id, player2, bet_amount) → ()`
Player 2 joins and matches the bet. Automatically calls `GameHub.start_game()`.

### `submit_score(session_id, player, score, zk_proof) → ()`
Submit a player's verified score with their ZK proof.

### `reveal_winner(session_id) → Address`
Determines the winner, transfers the XLM prize pool, and calls `GameHub.end_game()`.

---

## 🧪 Testing

```bash
# Unit tests (game logic, store, scoring)
cd frontend
npm run test:run

# Smart contract tests
cd smart-contract/contracts/minesweeper-zk
cargo test
```

---

## 📜 License

MIT — Built for the Stellar Hacks: ZK Gaming Hackathon 2026.
]]>