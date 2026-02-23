# Minesweeper ZK: Demo Script (~2 Minutes)

---

### [0:00 - 0:20] Intro
**(Screen: Landing Page)**

"This is **Minesweeper ZK** — a competitive puzzle game where players prove they solved a hidden Minesweeper board using zero-knowledge proofs on Stellar.

The problem: if you put Minesweeper on a blockchain, everyone can see where the mines are. We fix this with **o1js ZK proofs** — the board is generated locally from a shared seed, and players prove they won without ever revealing the mine positions to the network."



### [0:20 - 0:50] Creating a Match
**(Screen: Connect wallet via Freighter, then Create Game)**

"I'll connect my Freighter wallet and create a new game room. This deploys a bet into our Soroban smart contract escrow on Stellar Testnet.

*[Approve Freighter tx]*

Now on a second browser, Player 2 joins and matches the bet. When Player 2 joins, the contract automatically calls `start_game` on the official DoraHacks Game Hub."

"Our contract talks to the official Game Hub at two moments: when both players join (registering the match) and when we have a winner (reporting the result). It's all automatic cross-contract calls on Stellar Testnet."

### [0:50 - 1:30] Gameplay
**(Screen: Play the Minesweeper board)**

"Both players now have the same board generated from the combined seed. They play simultaneously in their browsers. The ZK circuit runs entirely client-side.

*(Play through the board — click tiles, flag mines)*

When I clear the board, `o1js` generates a cryptographic proof that my moves are valid against the hidden grid — without revealing mine locations."

### [1:30 - 2:00] On-Chain Verification
**(Screen: Submit score, show Freighter tx)**

"Now I submit my ZK proof to the Soroban contract. It verifies the proof on-chain, transfers the XLM prize pool to the winner, and calls `end_game` on the Game Hub.

**(Screen: Victory screen)**

"ZK lets us verify game outcomes on-chain without exposing hidden game state — solving the fundamental tension between blockchain transparency and hidden-information gameplay."

That's Minesweeper ZK — provably fair, zero-knowledge competitive gaming on Stellar. Thanks for watching!"
