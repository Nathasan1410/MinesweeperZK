# Minesweeper ZK: Hackathon Demo Script (2-3 Minutes)

> **Tip:** Keep this open on another screen while you record using OBS, Loom, or Zoom! Don't worry about being perfect; judges care more about the architecture and that it works.

---

### [0:00 - 0:30] Introduction & Concept
**(Screen: Show the Landing Page of your running Next.js app)**

"Hi, I'm excited to present **Minesweeper ZK**, built for the Stellar Hacks: ZK Gaming hackathon! 

The premise of Minesweeper ZK is taking the classic hidden-information game and bringing it on-chain without trusting a centralized server. Traditionally, if you put a Minesweeper board on a blockchain, everyone can read the contract state and see where the mines are. 

To solve this, I used **o1js zero-knowledge proofs**. Players commit to a random seed, the board generates deterministically on their local machine, and they play the game entirely in their browser. When they win, they generate a ZK proof locally that proves their moves correspond to a valid sweeping of the board—without actually revealing the grid to the network!"

### [0:30 - 1:15] Establishing the Match (The Async Flow)
**(Screen: Click 'Create Game', deploy the bet transaction via Freighter)**

"Let me show you a live match. Our architecture uses Firebase as an off-chain signaling server to allow **asynchronous matchmaking**. Player 1 doesn't have to wait online for someone to join. 

I'm creating a lobby right now and paying the XLM bounty into our custom Soroban smart contract escrow. *[Approve Freighter transaction]*

**(Screen: Open an Incognito Window or split screen, and Join the Game as Player 2)**

"Now, as Player 2, I join the lobby and match the bet. *[Approve Freighter transaction]*
Behind the scenes, when Player 2 joins, our smart contract natively executes a cross-contract call to the official **DoraHacks Game Hub**, triggering `start_game` and registering this match on the Stellar Testnet."

### [1:15 - 2:00] The Gameplay & ZK Circuit
**(Screen: Show the game board, start clicking safe tiles, avoid mines)**

"Both players now have the combined seed and play the board locally. The ZK circuit is loaded in the browser.

*(Fast forward to winning the game, or click the last safe tile)*

When a player solves the board, `o1js` kicks in. It takes the game seed, the sequence of clicked tiles, and the final score, and computes a cryptographic proof verifying that no mines were detonated."

### [2:00 - 2:45] Verification & Game Hub Integration
**(Screen: Click 'Submit Score & Claim', show Freighter transaction approval)**

"Once the proof is generated, we submit it to our Soroban smart contract via the `submit_score` function. 
The smart contract acts as the final arbiter. It verifies the ZK proof mathematically. 

If it's valid, two things happen instantly on-chain: 
1. The contract transfers the entire XLM prize pool to the winner's wallet.
2. The contract triggers `end_game` on the official **Hackathon Game Hub** mock contract.

**(Screen: Show the final 'You Won!' screen and optionally open Stellar Expert to show the transaction executing)**

"And that's Minesweeper ZK! A provably fair, skill-based puzzle game with asynchronous matchmaking and natively verified zero-knowledge mechanics on the Stellar network. Thank you!"
