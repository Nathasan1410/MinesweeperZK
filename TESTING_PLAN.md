# Minesweeper ZK - Testing Plan

**Date:** 2026-02-18
**Status:** Ready for Manual Testing

---

## Automated Checks

### TypeScript Compilation
```bash
cd frontend && npx tsc --noEmit
```
**Status:** ✅ PASSED (Exit code 0)

### Dev Server
```bash
cd frontend && bun run dev
```
**Status:** ✅ RUNNING on http://localhost:3000

---

## Manual Test Cases

### 1. Wallet Connection

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Dev Wallet Connection | 1. Open app<br>2. Click "Connect Wallet"<br>3. Select "Dev Mode"<br>4. Choose a dev wallet | Wallet connects, address displayed, redirected to lobby |
| Freighter Connection | 1. Open app<br>2. Click "Connect Wallet"<br>3. Select Freighter<br>4. Approve in Freighter extension | Wallet connects, address displayed, redirected to lobby |

### 2. Single Player Mode

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Start Solo Game | 1. Connect wallet<br>2. Click "Play Solo" | Game starts with random seed, timer begins |
| Reveal Cells | Click cells on the board | Cells reveal, numbers update, timer increments |
| Flag Mines | Switch to flag mode, click cells | Flags appear, score updates |
| Hit Mine | Click on a mine cell | Game over, mines revealed, summary shown |
| Win Game | Reveal all non-mine cells | Victory screen, score displayed |

### 3. Multiplayer - Create Room

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Create Public Room | 1. Click "Create Room"<br>2. Enter room name<br>3. Set bet amount<br>4. Enable "Public Room"<br>5. Click Create | Room created, room code displayed, waiting room shown |
| Create Private Room | 1. Click "Create Room"<br>2. Enter room name<br>3. Leave "Public Room" disabled<br>4. Click Create | Room created, room code shown, NOT in public list |

### 4. Multiplayer - Join Room

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Join via Room List | 1. Go to Lobby<br>2. Find room in list<br>3. Click "Join" | Room joined, waiting for seed commitment |
| Join via Code | 1. Click "Join Room"<br>2. Enter room code<br>3. Click Join | Room joined, waiting for seed commitment |
| Invalid Room Code | 1. Click "Join Room"<br>2. Enter invalid code<br>3. Click Join | Error notification: "Room Not Found" |

### 5. Seed Commitment Flow

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Player 1 Commits | 1. Enter seed-commit phase<br>2. Click "Generate & Commit Seed" | Seed generated, hash displayed, waiting for P2 |
| Player 2 Commits | P2 clicks "Generate & Commit Seed" | Both players see "Reveal Your Seed" button |
| Player 1 Reveals | P1 clicks "Reveal Seed" | Seed revealed, waiting for P2 |
| Player 2 Reveals | P2 clicks "Reveal Seed" | Combined seed generated, game starts |
| Same Minefield | Both players check their boards | Both have identical minefield layout |

### 6. Multiplayer Gameplay

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Real-time Progress | P1 reveals cells | P2 sees P1's progress update |
| Opponent Score | Play until both have scores | Both players see each other's scores |
| Simultaneous Play | Both players play at once | No conflicts, smooth gameplay |
| Player 1 Wins | P1 completes, P2 hits mine | P1 wins, summary shows P1 victory |
| Player 2 Wins | P2 completes, P1 hits mine | P2 wins, summary shows P2 victory |

### 7. Contract Integration

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Start Game Transaction | Game starts via seed commitment | Console: "Game started successfully", tx hash logged |
| Submit Score Transaction | Game ends, score submitted | Console: "Score submitted", tx hash logged |
| Claim Prize Transaction | Winner claims prize | Console: "Prize claimed", tx hash logged |
| Error Handling | Disconnect network during transaction | Error notification shown, graceful fallback |

### 8. Game Flow Edge Cases

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Player Disconnects | P1 closes browser during game | P2 sees "Opponent disconnected" |
| Refresh During Game | Refresh page while playing | Game state restored via Firebase |
| Timeout | Leave room idle for 30 minutes | Room expires, removed from list |
| Concurrent Rooms | Create multiple rooms | All rooms work independently |

### 9. UI/UX

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Mobile Responsive | Open on mobile device | Layout adapts, all buttons accessible |
| Loading States | Perform async operations | Loading spinners shown |
| Notifications | Trigger various events | Toast notifications appear |
| Icons | Check all UI elements | Only Lucide icons, no emojis |
| Colors | Check all themes | No gradients, solid colors only |

---

## Known Issues & Workarounds

1. **Freighter API**: Some browsers may need Freighter extension installed
2. **Firebase Connection**: Ensure Firebase is properly configured
3. **Contract Simulation**: Dev wallets use simulated transactions

---

## Test Data

### Dev Wallets
```
ADMIN: GAWK4FEEYQ3RHINSSBBUGX6T6K7DED5TYZPO4K3QN6LZ7DRKOU6THKJT
PLAYER1: GDOU6C4NXN37MKRR75Z75B4DA4LN2EK3TYOD7GODPY2WN2VB44KJV4CC
PLAYER2: GAMHAOUJG474HELCKG4MXCULGKY7PUMJWWCS3CXYFW6NZUI27EAGUWIJ
```

### Contract Addresses (Testnet)
```
GAME_HUB: CB4VZAT2U3UC6XFK3N23SKRF2NDCMP3QHJYMCHHFMZO7MRQ2EMYG
MINESWEEPER_ZK: CBJF6WUHRKDVLVWICLPVUCU2CTNJGRRYMFASEESFSB4HKYD54VIWWGLU
```

---

## Test Execution Checklist

- [ ] Wallet Connection (Dev + Freighter)
- [ ] Single Player Mode
- [ ] Create Room (Public + Private)
- [ ] Join Room (List + Code)
- [ ] Seed Commitment (Commit + Reveal)
- [ ] Multiplayer Gameplay
- [ ] Contract Integration
- [ ] Edge Cases
- [ ] UI/UX Responsive Design

---

## Results

### Date: _______________
### Tester: _______________

| Test Case | Status | Notes |
|-----------|--------|-------|
| Wallet Connection | ☐ Pass ☐ Fail | |
| Single Player | ☐ Pass ☐ Fail | |
| Create Room | ☐ Pass ☐ Fail | |
| Join Room | ☐ Pass ☐ Fail | |
| Seed Commitment | ☐ Pass ☐ Fail | |
| Multiplayer Game | ☐ Pass ☐ Fail | |
| Contract Integration | ☐ Pass ☐ Fail | |
| Edge Cases | ☐ Pass ☐ Fail | |
| UI/UX | ☐ Pass ☐ Fail | |

**Overall Status:** ☐ PASS ☐ FAIL

---

## Automated Tests (TODO)

To be implemented:
- [ ] Unit tests for game logic (minesweeper.ts)
- [ ] Unit tests for store (store.ts)
- [ ] Integration tests for Firebase hooks
- [ ] E2E tests with Playwright
- [ ] Contract integration tests with mocked RPC

---

## Notes

- All transactions use testnet
- Dev wallets use simulated transactions
- Real contracts deployed on Stellar testnet
