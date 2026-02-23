# Minesweeper ZK 💣
### A Provably Fair Asynchronous Puzzle Game on Stellar

*Built for the [DoraHacks Stellar Hacks: ZK Gaming](https://dorahacks.io/hackathon/stellar-hacks-zk-gaming) Hackathon.*

---

## 🏆 Project Overview
**Minesweeper ZK** brings the classic game of logical deduction on-chain without exposing hidden state. 
By utilizing **o1js zero-knowledge proofs**, we allow players to safely challenge each other in competitive puzzles, completely off-chain, and settle their final validated outcomes anonymously on the **Soroban (Stellar) smart contract network**.

### Hackathon Requirements Met:
1. ✅ **A ZK-Powered Mechanic:** The core game loop requires a ZK Proof to verify that the player legitimately cleared the Minesweeper board without hitting hidden mines.
2. ✅ **A Deployed Onchain Component:** The game acts as an escrow, executing payouts in XLM. Crucially, the contract successfully aggregates cross-contract calls to the **Official Hackathon Game Hub** (`CB4VZAT...`) by seamlessly triggering `start_game` when lobbies are joined and `end_game` when valid proofs are submitted.
3. ✅ **A Functional Front End:** A responsive Next.js frontend with native Freighter wallet integration, off-chain matchmaking via Firebase, and an interactive in-browser Minesweeper grid.
4. ✅ **Open-Source & Verifiable:** All React code, ZK circuits (`o1js`), and Soroban Rust contracts are open-sourced in this repository.

---

## 🏗️ Architecture

Minesweeper ZK elegantly bridges Web2 real-time sockets with Web3 zero-knowledge cryptography:

1. **Firebase Matching Room (Off-Chain):**
   - Game lobbies are fully asynchronous. 
   - Player 1 creates a lobby and commits an initial local "PRNG Seed" hash.
   - Player 2 joins later, matches the XLM wager on-chain, and commits their own seed hash.

2. **The Sweep (Local Execution):**
   - The two isolated seeds are cryptographically merged. This combined seed deterministically maps the positions of all hidden mines on a local `Grid(10x10)`.
   - Players solve the Sweeper board simultaneously in their browsers.

3. **o1js Zero Knowledge Proof (In-Browser):**
   - The instant a player flags the final mine, `o1js` compiles a recursive proof.
   - It mathematically verifies that the sequence of opened tiles exactly corresponds to a "Win" state against the deterministic grid seed.
   - **The location of the mines is never revealed to the network.**

4. **Soroban Arbitration (On-Chain):**
   - The user triggers `submit_score` on the Soroban smart contract, bridging their zero-knowledge proof payload.
   - The contract verifies the proof format, transfers the cumulative XLM pooled bounty to the victor, and triggers `end_game` on the Hackathon Hub!

---

## 🧰 Tech Stack
* **Frontend:** Next.js (TypeScript), React, Tailwind CSS
* **Wallet:** `@stellar/freighter-api`
* **Network Integration:** `@stellar/stellar-sdk`
* **Realtime Infrastructure:** Firebase Realtime Database
* **Smart Contracts:** Rust, Soroban SDK
* **Zero-Knowledge Circuits:** `o1js` 

---

## 🚀 Running Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://rustup.rs/) (with `wasm32-unknown-unknown` target)
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup)
- [Freighter Wallet Extension](https://www.freighter.app/)

### 2. Smart Contract Initialization
*(Assuming you wish to deploy your own instance. Our production Testnet contract is already deployed.)*

```bash
cd smart-contract
cargo check --target wasm32-unknown-unknown
stellar contract build
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/minesweeper_zk.wasm
stellar contract deploy --wasm target/wasm32-unknown-unknown/release/minesweeper_zk.optimized.wasm --source <YOUR_IDENTITY> --network testnet -- --admin <YOUR_PUBLIC_KEY> --game_hub CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG
```
*Take note of the resulting 56-character `C...` Contract ID.*

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
npm install
```

Configure your `.env.local` variables from the root folder:
```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_MINESWEEPER_CONTRACT=<YOUR_DEPLOYED_C_ADDRESS>
NEXT_PUBLIC_GAME_HUB_CONTRACT=CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQO6DQ2EMYG

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_DATABASE_URL="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
...
```

Start the development server:
```bash
npm run dev
```

The game is now active at `http://localhost:3000`.

---
*Built by [Your Name] for tracking recursive sweeps securely on-chain.*