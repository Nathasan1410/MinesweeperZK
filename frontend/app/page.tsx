/**
 * Minesweeper ZK - Main Page
 * Single-page app with game views
 */

'use client';

import { useState, useEffect } from 'react';
import { Lock, Zap, Gamepad2, Wallet, Plus, Users, Copy, Check } from 'lucide-react';
import { useMinesweeperGame } from '@/hooks/use-minesweeper-game';
import { useRoomMutations, generateRoomCode, formatRoomStatus, useRoom, useRoomTimeout, getRoomByCode, joinRoom } from '@/hooks/use-firebase-room';
import { SeedCommitmentFlow } from '@/components/multiplayer/seed-commitment-flow';
import { useCreateGame, useJoinGame, useSubmitScore, useClaimPrize } from '@/hooks/use-contract-game';
import { ref, get } from 'firebase/database';
import { getDb, DB_PATHS } from '@/lib/firebase/client';
import { generateZKProof } from '@/lib/zk/proof-generator';
import { GameContainer } from '@/components/game';
import { CommitRevealPage } from '@/components/multiplayer/commit-reveal-page';
import { DualSummaryVerdict } from '@/components/summary-verdict';
import { LobbyPage } from '@/components/lobby-page';
import { stellarClient, DEV_WALLETS } from '@/lib/stellar/client';
import { GAME_CONFIG, THEME_COLORS } from '@/lib/game/types';
import type { Minefield } from '@/lib/game/types';

// ============================================================================
// VIEW TYPES
// ============================================================================

type AppView = 'landing' | 'wallet-connect' | 'lobby' | 'create-room' | 'join-room' | 'waiting-room' | 'seed-commit' | 'game' | 'commit-reveal' | 'summary';

// ============================================================================
// LANDING PAGE COMPONENT
// ============================================================================

function LandingPage({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Hero */}
      <div className="max-w-3xl text-center space-y-6">
        <h1
          className="text-6xl md:text-7xl font-black tracking-tighter"
          style={{
            color: THEME_COLORS.safe,
          }}
        >
          MINESWEEPER ZK
        </h1>

        <p className="text-xl md:text-2xl text-textSecondary font-light">
          Prove your skills. Win rewards. All verified on-chain.
        </p>

        <p className="text-sm text-textSecondary max-w-md mx-auto">
          A zero-knowledge minesweeper game on Stellar blockchain.
          Your gameplay is cryptographically verified without revealing your strategy.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <FeatureCard
            icon={<Lock className="w-8 h-8" />}
            title="Zero-Knowledge"
            description="Your gameplay is verified without revealing your moves"
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Instant Payouts"
            description="Win XLM directly to your wallet when you win"
          />
          <FeatureCard
            icon={<Gamepad2 className="w-8 h-8" />}
            title="Fair Play"
            description="Proven fair game with commit-reveal mechanism"
          />
        </div>

        {/* CTA Button */}
        <button
          onClick={onConnect}
          className="mt-12 px-12 py-4 rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-2xl"
          style={{
            backgroundColor: THEME_COLORS.safe,
            color: THEME_COLORS.background,
          }}
        >
          Connect Wallet to Play
        </button>

        {/* Dev Mode Toggle */}
        <div className="mt-8">
          <DevModeToggle onToggle={(isDev) => console.log('Dev mode:', isDev)} />
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-xs text-textSecondary">
        Built for Stellar Hacks: ZK Gaming • Powered by RISC Zero
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div
      className="p-6 rounded-xl border"
      style={{ backgroundColor: THEME_COLORS.surface, borderColor: THEME_COLORS.border }}
    >
      <div className="mb-3 flex items-center justify-center" style={{ color: THEME_COLORS.safe }}>
        {icon}
      </div>
      <h3 className="font-semibold text-textPrimary mb-2">{title}</h3>
      <p className="text-sm text-textSecondary">{description}</p>
    </div>
  );
}

// ============================================================================
// WALLET CONNECT COMPONENT
// ============================================================================

function WalletConnectPage({ onConnected, onBack }: { onConnected: () => void; onBack: () => void }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedDevWallet, setSelectedDevWallet] = useState<keyof typeof DEV_WALLETS | null>(null);

  const handleConnectFreighter = async () => {
    setIsConnecting(true);
    try {
      const account = await stellarClient.connectWallet();
      if (account) {
        onConnected();
      }
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSelectDevWallet = (wallet: keyof typeof DEV_WALLETS) => {
    stellarClient.switchDevWallet(wallet);
    setSelectedDevWallet(wallet);
    onConnected();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <button
          onClick={onBack}
          className="text-sm text-textSecondary hover:text-textPrimary transition-colors"
        >
          ← Back
        </button>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-textPrimary">Connect Wallet</h2>
          <p className="text-textSecondary">Choose how you want to play</p>
        </div>

        {/* Real Wallet */}
        <button
          onClick={handleConnectFreighter}
          disabled={isConnecting}
          className="w-full p-6 rounded-xl border-2 font-semibold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: THEME_COLORS.surface,
            borderColor: THEME_COLORS.safe,
          }}
        >
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ color: THEME_COLORS.safe }}>
              <Wallet className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="text-textPrimary">Freighter Wallet</div>
              <div className="text-sm text-textSecondary">
                {isConnecting ? 'Connecting...' : 'Connect your Stellar wallet'}
              </div>
            </div>
          </div>
        </button>

        {/* Dev Wallets */}
        <div className="space-y-3">
          <p className="text-xs text-textSecondary text-center uppercase tracking-wide">
            Dev Mode (Testnet)
          </p>

          <button
            onClick={() => handleSelectDevWallet('PLAYER1')}
            className="w-full p-4 rounded-lg border font-semibold transition-all hover:scale-[1.02] hover:border-safe"
            style={{
              backgroundColor: THEME_COLORS.surface,
              borderColor: THEME_COLORS.border,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-textPrimary">Dev Wallet 1</span>
              <span className="text-xs font-mono text-textSecondary">
                {DEV_WALLETS.PLAYER1.slice(0, 8)}...
              </span>
            </div>
          </button>

          <button
            onClick={() => handleSelectDevWallet('PLAYER2')}
            className="w-full p-4 rounded-lg border font-semibold transition-all hover:scale-[1.02] hover:border-flag"
            style={{
              backgroundColor: THEME_COLORS.surface,
              borderColor: THEME_COLORS.border,
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-textPrimary">Dev Wallet 2</span>
              <span className="text-xs font-mono text-textSecondary">
                {DEV_WALLETS.PLAYER2.slice(0, 8)}...
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CREATE ROOM PAGE COMPONENT
// ============================================================================

function CreateRoomPage({
  onCancel,
  onCreated
}: {
  onCancel: () => void;
  onCreated: (roomId: string, roomCode: string, sessionId: number) => void;
}) {
  const { player, showNotification } = useMinesweeperGame();
  const { createRoom, isCreating } = useRoomMutations();
  const { createGame, isCreating: isCreatingGame } = useCreateGame();
  const [roomName, setRoomName] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    if (!player) {
      setError('Please connect your wallet first');
      return;
    }

    const sessionId = Math.floor(Math.random() * 1000000);

    const success = await createGame({
      sessionId,
      player1: player.address,
      betAmount: betAmount,
    });

    if (!success) {
      setError('Contract transaction failed. Cannot create room.');
      showNotification('error', 'Creation Failed', 'Failed to initialize game on contract.');
      return;
    }

    const result = await createRoom({
      name: roomName || `${player.address.slice(0, 8)}'s Room`,
      creator: player.address.slice(0, 8),
      creatorAddress: player.address,
      betAmount,
      isPublic: true,
      contractSessionId: sessionId,
    });

    if (result) {
      showNotification('success', 'Room Created', `Room code: ${result.roomCode}. Share with your opponent!`);
      onCreated(result.roomId, result.roomCode, sessionId);
    } else {
      setError('Failed to create room. Please try again.');
      showNotification('error', 'Creation Failed', 'Could not create room. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <button
          onClick={onCancel}
          className="text-sm text-textSecondary hover:text-textPrimary transition-colors"
        >
          ← Back to Lobby
        </button>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-textPrimary">Create Room</h2>
          <p className="text-textSecondary">Set up a new game room</p>
        </div>

        <div
          className="p-6 rounded-xl space-y-4"
          style={{ backgroundColor: THEME_COLORS.surface, border: `1px solid ${THEME_COLORS.border}` }}
        >
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="w-full px-4 py-2 rounded-lg bg-background border border-border text-textPrimary focus:outline-none focus:border-safe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Bet Amount (XLM)
            </label>
            <select
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-background border border-border text-textPrimary focus:outline-none focus:border-safe"
            >
              <option value={5}>5 XLM</option>
              <option value={10}>10 XLM</option>
              <option value={25}>25 XLM</option>
              <option value={50}>50 XLM</option>
            </select>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-mine/20 text-mine text-sm">
              {error}
            </div>
          )}
        </div>

        <button
          onClick={handleCreate}
          disabled={isCreating || isCreatingGame}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50"
          style={{
            backgroundColor: THEME_COLORS.safe,
            color: THEME_COLORS.background,
          }}
        >
          {isCreating || isCreatingGame ? 'Creating...' : 'Create Room'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// JOIN ROOM PAGE COMPONENT
// ============================================================================

function JoinRoomPage({
  onCancel,
  onJoined,
  isJoining
}: {
  onCancel: () => void;
  onJoined: (roomCode: string) => void;
  isJoining?: boolean;
}) {
  const [roomCode, setRoomCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleJoin = () => {
    if (roomCode.trim().length === 4) {
      onJoined(roomCode.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <button
          onClick={onCancel}
          className="text-sm text-textSecondary hover:text-textPrimary transition-colors"
        >
          ← Back to Lobby
        </button>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-textPrimary">Join Room</h2>
          <p className="text-textSecondary">Enter a room code to join</p>
        </div>

        <div
          className="p-6 rounded-xl space-y-4"
          style={{ backgroundColor: THEME_COLORS.surface, border: `1px solid ${THEME_COLORS.border}` }}
        >
          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Room Code
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
              placeholder="ABCD"
              maxLength={4}
              className="w-full px-4 py-3 rounded-lg bg-background border-2 border-border text-center text-2xl font-mono text-textPrimary focus:outline-none focus:border-safe"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={roomCode.length !== 4 || isJoining}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              backgroundColor: roomCode.length === 4 ? THEME_COLORS.flag : THEME_COLORS.surface,
              color: roomCode.length === 4 ? THEME_COLORS.background : THEME_COLORS.textSecondary,
            }}
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        <div className="text-center text-sm text-textSecondary">
          Ask the room creator for the 4-character code
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WAITING ROOM COMPONENT
// ============================================================================

function WaitingRoom({
  roomCode,
  playerCount,
  onCancel
}: {
  roomCode: string;
  playerCount: number;
  onCancel: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBothPlayersReady = playerCount >= 2;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ backgroundColor: isBothPlayersReady ? THEME_COLORS.flag : THEME_COLORS.safe }}
        >
          <Users className="w-8 h-8" style={{ color: THEME_COLORS.background }} />
        </div>

        <h2 className="text-3xl font-bold text-textPrimary">
          {isBothPlayersReady ? 'Both Players Ready!' : 'Waiting for Player 2'}
        </h2>
        <p className="text-textSecondary">
          {isBothPlayersReady
            ? 'Seed commitment phase starting...'
            : 'Share this room code with your opponent:'}
        </p>

        <div className="flex items-center justify-center gap-3">
          <div
            className="px-6 py-3 rounded-xl text-3xl font-mono"
            style={{ backgroundColor: THEME_COLORS.surface, color: THEME_COLORS.textPrimary }}
          >
            {roomCode}
          </div>
          <button
            onClick={copyRoomCode}
            className="p-3 rounded-xl transition-all"
            style={{ backgroundColor: THEME_COLORS.surface }}
          >
            {copied ? (
              <Check className="w-5 h-5 text-safe" />
            ) : (
              <Copy className="w-5 h-5 text-textSecondary" />
            )}
          </button>
        </div>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{
            backgroundColor: isBothPlayersReady ? `${THEME_COLORS.flag}/20` : THEME_COLORS.surface,
            color: isBothPlayersReady ? THEME_COLORS.flag : THEME_COLORS.textPrimary,
          }}
        >
          <Users className="w-4 h-4" />
          {playerCount}/2 Players Joined
        </div>

        <button
          onClick={onCancel}
          className="text-sm text-textSecondary hover:text-textPrimary transition-colors underline"
        >
          Cancel and return to lobby
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// LOBBY PAGE COMPONENT
// ============================================================================

// ============================================================================
// DEV MODE TOGGLE
// ============================================================================

function DevModeToggle({ onToggle }: { onToggle: (enabled: boolean) => void }) {
  const [enabled, setEnabled] = useState(false);

  const handleToggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    onToggle(newState);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        px-4 py-2 rounded-full text-xs font-mono transition-all
        ${enabled ? 'bg-safe/20 text-safe' : 'bg-surface text-textSecondary'}
      `}
      style={{ border: `1px solid ${enabled ? THEME_COLORS.safe : THEME_COLORS.border}` }}
    >
      DEV MODE: {enabled ? 'ON' : 'OFF'}
    </button>
  );
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [gameKey, setGameKey] = useState(0); // Force remount on new game
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null);
  const [contractSessionId, setContractSessionId] = useState<number | null>(null);
  const [opponentAddress, setOpponentAddress] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false); // True if current player is room creator
  const [betAmount] = useState(10); // Default bet amount (10 XLM)
  const [isJoiningRoom, setIsJoiningRoom] = useState(false); // Loading state for joining room

  const {
    player,
    setPlayer,
    setDevWallet,
    setRoom,
    setSeed,
    startGame,
    resetGame,
    showNotification,
    phase,
    score,
    playerMoves,
    isWinner,
    opponentScore,
    myMinefield,
    seed,
    finalMinefield,
    finalScore,
    finalTime,
    saveGameSnapshot,
  } = useMinesweeperGame();

  // State for summary data (from Firebase, after commit-reveal)
  const [summaryData, setSummaryData] = useState<{
    player1Score: number;
    player2Score: number;
    player1Minefield: string;
    player2Minefield: string;
    player1Time: string;
    player2Time: string;
    player1Address: string;
    player2Address: string;
    winner: string;
  } | null>(null);

  // Subscribe to room state changes
  const room = useRoom(currentRoomId)?.room;

  // Auto-expire rooms after 15 minutes of inactivity
  useRoomTimeout(currentRoomId, room, () => {
    console.log('[Timeout] Room expired, redirecting to lobby');
    showNotification('warning', 'Room Expired', 'This room has expired due to inactivity.');
    resetGame();
    setCurrentRoomId(null);
    setCurrentRoomCode(null);
    setGameKey(prev => prev + 1);
    setCurrentView('lobby');
  });

  // Contract hooks
  const { joinGame, isJoining: isJoiningGame } = useJoinGame();
  const submitScoreHook = useSubmitScore();
  const claimPrizeHook = useClaimPrize();

  // Initialize player on mount
  useEffect(() => {
    // Check if previously connected
    const storedPlayer = stellarClient.getCurrentAccount();
    if (storedPlayer) {
      setPlayer(storedPlayer);
    }
  }, [setPlayer]);

  // Auto-transition when room status changes to 'ready' (both players joined)
  useEffect(() => {
    console.log('[Auto-transition] Checking:', {
      currentView,
      roomStatus: room?.status,
      roomId: currentRoomId,
    });

    // Only check if we're in a waiting state and room is ready
    if ((currentView === 'waiting-room' || currentView === 'lobby') && room?.status === 'ready') {
      console.log('[Auto-transition] Transitioning to seed-commit view');
      // Both players have joined - transition to seed commitment phase
      setCurrentView('seed-commit');
    }
  }, [currentView, room?.status, currentRoomId]);

  // Store opponent address and determine if current player is creator
  useEffect(() => {
    if (!room || !player) return;

    // Check if current player is the creator
    if (room.creatorAddress === player.address) {
      setIsCreator(true);
      // Opponent is player2
      if (room.player2Address) {
        setOpponentAddress(room.player2Address);
      }
    } else {
      setIsCreator(false);
      // Current player is player2, opponent is creator
      setOpponentAddress(room.creatorAddress);
    }
  }, [room, player]);

  // Auto-transition: game → commit-reveal when game phase changes to 'summary'
  useEffect(() => {
    if (phase === 'summary' && currentView === 'game' && opponentAddress !== null) {
      // Multiplayer game ended - save snapshot and transition to commit-reveal
      saveGameSnapshot();
      setCurrentView('commit-reveal');
    }
  }, [phase, currentView, opponentAddress, saveGameSnapshot]);

  // Handle game end - generate ZK proof and submit score
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  useEffect(() => {
    const handleGameEnd = async () => {
      // Only handle multiplayer games that have ended AND user is in summary view
      if (
        phase !== 'summary' ||
        !player ||
        !contractSessionId ||
        currentView !== 'summary' ||
        hasSubmittedScore
      ) {
        return;
      }
      
      setHasSubmittedScore(true);

      // Solo games don't submit to contract
      if (opponentAddress === null) {
        return;
      }

      console.log('[Contract] Game ended, submitting score...');

      // Generate ZK proof
      const zkProof = await generateZKProof(
        contractSessionId,
        score.toString(), // Using score as part of seed verification
        playerMoves,
        score
      );

      console.log('[Contract] ZK proof generated:', zkProof);

      // Submit score to contract
      const submitted = await submitScoreHook.submitScore({
        sessionId: contractSessionId,
        playerAddress: player.address,
        score: score,
        moves: playerMoves.length,
        zkProof,
      });

      if (submitted) {
        console.log('[Contract] Score submitted, tx:', submitScoreHook.txHash);
        showNotification('success', 'Score Submitted', 'Your score has been recorded on-chain');

        // If this player won, initiate prize claim
        if (isWinner === true) {
          console.log('[Contract] Claiming prize...');
          const claimed = await claimPrizeHook.claimPrize(
            contractSessionId,
            player.address
          );

          if (claimed) {
            console.log('[Contract] Prize claimed, tx:', claimPrizeHook.txHash);
            showNotification('success', 'Prize Claimed!', 'Congratulations! You won the bet.');
          }
        }
      } else {
        console.error('[Contract] Failed to submit score:', submitScoreHook.error);
        showNotification('error', 'Score Submission Failed', submitScoreHook.error?.message ?? 'Failed to submit score to contract');
      }
    };

    handleGameEnd();
  }, [phase, contractSessionId, player, opponentAddress, currentView]);

  const handleConnectWallet = () => {
    setCurrentView('wallet-connect');
  };

  const handleWalletConnected = () => {
    const account = stellarClient.getCurrentAccount();
    if (account) {
      setPlayer(account);
      setDevWallet(stellarClient.isDevWallet());
    }
    setCurrentView('lobby');
  };

  const handlePlaySolo = () => {
    // Generate cryptographically secure random seed for this game
    // Math.random() is insecure and predictable - use crypto.getRandomValues() instead
    const seed = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => b.toString(36))
      .join('')
      .substring(0, 12);
    setSeed(seed);
    setRoom('solo-room', 'SOLO');
    startGame();
    setCurrentView('game');
  };

  const handleRoomCreated = (roomId: string, roomCode: string, sessionId: number) => {
    setCurrentRoomId(roomId);
    setCurrentRoomCode(roomCode);
    setContractSessionId(sessionId);
    setCurrentView('waiting-room');
  };

  const handleJoinRoom = async (roomCode: string) => {
    if (!player) {
      console.error('Cannot join room: No wallet connected');
      showNotification('error', 'Wallet Required', 'Please connect your wallet first');
      return;
    }

    setIsJoiningRoom(true);
    setCurrentRoomCode(roomCode);

    try {
      // Step 1: Find room by code
      const roomQuery = await getRoomByCode(roomCode);
      if (!roomQuery) {
        console.error('Room not found:', roomCode);
        showNotification('error', 'Room Not Found', `Could not find room with code: ${roomCode}`);
        setIsJoiningRoom(false);
        return;
      }

      const sessionIdStr = roomQuery.contractSessionId;
      if (!sessionIdStr) {
        showNotification('error', 'Join Failed', 'Room has no valid contract session.');
        setIsJoiningRoom(false);
        return;
      }
      const sessionId = parseInt(sessionIdStr, 10);
      
      // Step 2: Call Soroban joinGame
      const success = await joinGame({
        sessionId,
        player2: player.address,
        betAmount: roomQuery.betAmount
      });

      if (!success) {
        showNotification('error', 'Join Failed', 'Contract transaction failed.');
        setIsJoiningRoom(false);
        return;
      }
      
      setContractSessionId(sessionId);

      // Step 3: Set room ID FIRST to start Firebase subscription BEFORE joining
      // This ensures we receive updates from Firebase immediately after the join
      setCurrentRoomId(roomQuery.id);

      // Step 4: Actually join the room via Firebase
      const joined = await joinRoom(roomQuery.id, player.address);

      if (!joined) {
        console.error('Failed to join room');
        showNotification('error', 'Join Failed', 'Could not join the room. Please try again.');
        // Clean up room ID on failure
        setCurrentRoomId(null);
        setIsJoiningRoom(false);
        return;
      }

      showNotification('success', 'Room Joined', 'Waiting for seed commitment phase...');

      // Step 4: Both players should see the same waiting screen
      // The auto-transition useEffect will handle moving to seed-commit when ready
      if (currentView === 'join-room') {
        setCurrentView('waiting-room');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      showNotification('error', 'Join Error', 'An unexpected error occurred. Please try again.');
      setCurrentRoomId(null);
    } finally {
      setIsJoiningRoom(false);
    }
  };

  // Join a room directly by ID (from lobby table)
  const handleJoinRoomById = async (roomId: string) => {
    if (!player) {
      showNotification('error', 'Wallet Required', 'Please connect your wallet first');
      return;
    }

    setIsJoiningRoom(true);
    try {
      const db = getDb();
      if (!db) throw new Error('Firebase DB not initialized');
      const roomRef = ref(db, `${DB_PATHS.ROOMS}/${roomId}`);
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) {
        throw new Error('Room not found');
      }
      const roomData = snapshot.val();
      
      const sessionIdStr = roomData.contractSessionId;
      if (!sessionIdStr) {
        showNotification('error', 'Join Failed', 'Room has no valid contract session.');
        setIsJoiningRoom(false);
        return;
      }
      const sessionId = parseInt(sessionIdStr, 10);
      
      // Call Soroban joinGame
      const success = await joinGame({
        sessionId,
        player2: player.address,
        betAmount: roomData.betAmount
      });

      if (!success) {
        showNotification('error', 'Join Failed', 'Contract transaction failed.');
        setIsJoiningRoom(false);
        return;
      }
      
      setContractSessionId(sessionId);

      setCurrentRoomId(roomId);
      const joined = await joinRoom(roomId, player.address);
      if (!joined) {
        showNotification('error', 'Join Failed', 'Could not join the room.');
        setCurrentRoomId(null);
        setIsJoiningRoom(false);
        return;
      }
      showNotification('success', 'Room Joined', 'Waiting for seed commitment phase...');
      setCurrentView('waiting-room');
    } catch (error) {
      console.error('Error joining room by ID:', error);
      showNotification('error', 'Join Error', 'An unexpected error occurred.');
      setCurrentRoomId(null);
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleCancelWaiting = () => {
    setCurrentRoomId(null);
    setCurrentRoomCode(null);
    setCurrentView('lobby');
  };

  const handleNewGame = () => {
    resetGame();
    setGameKey(prev => prev + 1); // Force remount
    setCurrentView('lobby');
  };

  // View routing
  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onConnect={handleConnectWallet} />;

      case 'wallet-connect':
        return (
          <WalletConnectPage
            onConnected={handleWalletConnected}
            onBack={() => setCurrentView('landing')}
          />
        );

      case 'lobby':
        return (
          <LobbyPage
            onCreateRoom={() => setCurrentView('create-room')}
            onJoinGame={(roomId) => {
              if (roomId) {
                // Direct join by room ID from lobby table
                handleJoinRoomById(roomId);
              } else {
                setCurrentView('join-room');
              }
            }}
            onDisconnect={() => {
              stellarClient.disconnect();
              setCurrentView('landing');
            }}
            onPlaySolo={handlePlaySolo}
            playerAddress={player?.address}
          />
        );

      case 'create-room':
        return (
          <CreateRoomPage
            onCancel={() => setCurrentView('lobby')}
            onCreated={handleRoomCreated}
          />
        );

      case 'join-room':
        return (
          <JoinRoomPage
            onCancel={() => setCurrentView('lobby')}
            onJoined={handleJoinRoom}
            isJoining={isJoiningRoom}
          />
        );

      case 'waiting-room':
        return currentRoomCode ? (
          <WaitingRoom
            roomCode={currentRoomCode}
            playerCount={room?.player2Address ? 2 : 1}
            onCancel={handleCancelWaiting}
          />
        ) : null;

      case 'seed-commit':
        return currentRoomId && player && opponentAddress ? (
          <SeedCommitmentFlow
            roomId={currentRoomId}
            playerAddress={player.address}
            onComplete={async (combinedSeed) => {
              setSeed(combinedSeed);

              // Start game now! Handled entirely natively. 
              showNotification('info', 'Game Synchronized', 'Matches verified locally.');

              startGame();
              setCurrentView('game');
            }}
          />
        ) : null;

      case 'game':
        return <GameContainer key={gameKey} />;

      case 'commit-reveal':
        return currentRoomId && player && opponentAddress ? (
          <CommitRevealPage
            sessionId={room?.sessionId ?? currentRoomId}
            roomId={currentRoomId}
            playerAddress={player.address}
            opponentAddress={opponentAddress}
            isCreator={isCreator}
            myScore={finalScore || score}
            myMinefield={finalMinefield || myMinefield}
            myTime={finalTime || '00:00'}
            onBothCommitted={(data) => {
              setSummaryData(data);
              setCurrentView('summary');
            }}
          />
        ) : null;

      case 'summary':
        if (summaryData && player) {
          // Parse minefields from JSON
          let p1Minefield: Minefield;
          let p2Minefield: Minefield;
          try {
            p1Minefield = JSON.parse(summaryData.player1Minefield);
            p2Minefield = JSON.parse(summaryData.player2Minefield);
          } catch {
            p1Minefield = finalMinefield || myMinefield;
            p2Minefield = finalMinefield || myMinefield;
          }

          return (
            <DualSummaryVerdict
              currentPlayerAddress={player.address}
              player1={{
                address: summaryData.player1Address,
                score: summaryData.player1Score,
                minefield: p1Minefield,
                time: summaryData.player1Time,
                isWinner: summaryData.winner === summaryData.player1Address,
              }}
              player2={{
                address: summaryData.player2Address,
                score: summaryData.player2Score,
                minefield: p2Minefield,
                time: summaryData.player2Time,
                isWinner: summaryData.winner === summaryData.player2Address,
              }}
              seed={seed}
              betAmount={betAmount}
              txHash={undefined}
              onFindNewMatch={() => {
                resetGame();
                setSummaryData(null);
                setGameKey(prev => prev + 1);
                setCurrentView('lobby');
              }}
              onBackToLobby={() => {
                resetGame();
                setSummaryData(null);
                setGameKey(prev => prev + 1);
                setCurrentView('lobby');
              }}
            />
          );
        }
        // Fallback: solo game summary or no data yet
        return <GameContainer key={gameKey} />;

      default:
        return <LandingPage onConnect={handleConnectWallet} />;
    }
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: THEME_COLORS.background }}>
      {renderView()}
    </main>
  );
}
