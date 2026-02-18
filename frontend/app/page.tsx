/**
 * Minesweeper ZK - Main Page
 * Single-page app with game views
 */

'use client';

import { useState, useEffect } from 'react';
import { Lock, Zap, Gamepad2, Wallet, Plus, Users, Copy, Check } from 'lucide-react';
import { useMinesweeperGame } from '@/hooks/use-minesweeper-game';
import { useRoomList, useRoomMutations, generateRoomCode, formatRoomStatus, useRoom, getRoomByCode, joinRoom } from '@/hooks/use-firebase-room';
import { SeedCommitmentFlow } from '@/components/multiplayer/seed-commitment-flow';
import { useContractGameFlow, useSubmitScore, useClaimPrize } from '@/hooks/use-contract-game';
import { generateZKProof } from '@/lib/zk/proof-generator';
import { GameContainer } from '@/components/game';
import { stellarClient, DEV_WALLETS } from '@/lib/stellar/client';
import { GAME_CONFIG, THEME_COLORS } from '@/lib/game/types';

// ============================================================================
// VIEW TYPES
// ============================================================================

type AppView = 'landing' | 'wallet-connect' | 'lobby' | 'create-room' | 'join-room' | 'waiting-room' | 'seed-commit' | 'game' | 'summary';

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
  onCreated: (roomId: string, roomCode: string) => void;
}) {
  const { player, showNotification } = useMinesweeperGame();
  const { createRoom, isCreating } = useRoomMutations();
  const [roomName, setRoomName] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    if (!player) {
      setError('Please connect your wallet first');
      return;
    }

    const result = await createRoom({
      name: roomName || `${player.address.slice(0, 8)}'s Room`,
      creator: player.address.slice(0, 8),
      creatorAddress: player.address,
      betAmount,
      isPublic: true,
    });

    if (result) {
      showNotification('success', 'Room Created', `Room code: ${result.roomCode}. Share with your opponent!`);
      onCreated(result.roomId, result.roomCode);
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
          disabled={isCreating}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50"
          style={{
            backgroundColor: THEME_COLORS.safe,
            color: THEME_COLORS.background,
          }}
        >
          {isCreating ? 'Creating...' : 'Create Room'}
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

function LobbyPage({
  onCreateRoom,
  onJoinRoom,
  onJoinRoomWithCode,
  onPlaySolo
}: {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onJoinRoomWithCode?: (roomCode: string) => void;
  onPlaySolo: () => void;
}) {
  const { player } = useMinesweeperGame();
  const { rooms, loading: roomsLoading, error: roomsError } = useRoomList();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Welcome */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-textPrimary">Game Lobby</h1>
          <p className="text-textSecondary">
            Welcome, {player?.address.slice(0, 8)}...{player?.address.slice(-4)}
          </p>
        </div>

        {/* Game Settings */}
        <div
          className="p-6 rounded-xl space-y-4"
          style={{ backgroundColor: THEME_COLORS.surface, border: `1px solid ${THEME_COLORS.border}` }}
        >
          <h3 className="font-semibold text-textPrimary">Game Settings</h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-textSecondary">Grid Size</span>
              <p className="font-semibold text-textPrimary">{GAME_CONFIG.GRID_SIZE}x{GAME_CONFIG.GRID_SIZE}</p>
            </div>
            <div>
              <span className="text-textSecondary">Mines</span>
              <p className="font-semibold text-textPrimary">{GAME_CONFIG.TOTAL_MINES}</p>
            </div>
            <div>
              <span className="text-textSecondary">Time Limit</span>
              <p className="font-semibold text-textPrimary">{GAME_CONFIG.TIMEOUT_MINUTES} min</p>
            </div>
            <div>
              <span className="text-textSecondary">Max Score</span>
              <p className="font-semibold text-safe">{GAME_CONFIG.MAX_SCORE}</p>
            </div>
          </div>

          <div className="pt-4 border-t" style={{ borderColor: THEME_COLORS.border }}>
            <div className="flex justify-between items-center text-sm">
              <span className="text-textSecondary">Network</span>
              <span className="font-semibold text-flag">Stellar Testnet</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-textSecondary">Bet Amount</span>
              <span className="font-semibold text-textPrimary">10 XLM</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onCreateRoom}
            className="py-4 px-6 rounded-xl font-bold text-lg transition-all hover:scale-105"
            style={{
              backgroundColor: THEME_COLORS.safe,
              color: THEME_COLORS.background,
            }}
          >
            Create Room
          </button>
          <button
            onClick={onJoinRoom}
            className="py-4 px-6 rounded-xl font-bold text-lg border-2 transition-all hover:scale-105"
            style={{
              backgroundColor: 'transparent',
              borderColor: THEME_COLORS.flag,
              color: THEME_COLORS.flag,
            }}
          >
            Join Room
          </button>
        </div>

        {/* Solo Play */}
        <div className="text-center">
          <button
            onClick={onPlaySolo}
            className="text-sm text-textSecondary hover:text-textPrimary transition-colors underline"
          >
            Or play solo (practice mode)
          </button>
        </div>

        {/* Public Rooms List */}
        <div
          className="p-6 rounded-xl space-y-4"
          style={{ backgroundColor: THEME_COLORS.surface, border: `1px solid ${THEME_COLORS.border}` }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-textPrimary">Public Rooms</h3>
            <Users className="w-4 h-4 text-textSecondary" />
          </div>

          {roomsLoading ? (
            <div className="text-center py-4 text-textSecondary">Loading rooms...</div>
          ) : roomsError ? (
            <div className="text-center py-4 text-mine">Error loading rooms. Please refresh.</div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-4 text-textSecondary">No active rooms</div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-3 rounded-lg border flex items-center justify-between"
                  style={{ borderColor: THEME_COLORS.border }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-textPrimary">{room.name}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: THEME_COLORS.surface,
                          color: room.status === 'waiting' ? THEME_COLORS.safe : THEME_COLORS.flag,
                        }}
                      >
                        {formatRoomStatus(room.status)}
                      </span>
                    </div>
                    <div className="text-xs text-textSecondary mt-1">
                      Code: <span className="font-mono">{room.code}</span> • Bet: {room.betAmount} XLM
                    </div>
                  </div>
                  <button
                    onClick={() => onJoinRoomWithCode?.(room.code)}
                    disabled={room.status !== 'waiting'}
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: room.status === 'waiting' ? THEME_COLORS.safe : THEME_COLORS.surface,
                      color: room.status === 'waiting' ? THEME_COLORS.background : THEME_COLORS.textSecondary,
                    }}
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  } = useMinesweeperGame();

  // Subscribe to room state changes
  const room = useRoom(currentRoomId)?.room;

  // Contract hooks
  const contractFlow = useContractGameFlow();
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
      player2Address: room?.player2Address,
      roomId: currentRoomId,
    });

    if ((currentView === 'waiting-room' || currentView === 'lobby') && room?.status === 'ready') {
      console.log('[Auto-transition] Transitioning to seed-commit view');
      // Both players have joined - transition to seed commitment phase
      setCurrentView('seed-commit');
    }
  }, [currentView, room?.status, room?.player2Address, currentRoomId]);

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

  // Handle game end - generate ZK proof and submit score
  useEffect(() => {
    const handleGameEnd = async () => {
      // Only handle multiplayer games that have ended
      if (
        phase !== 'summary' ||
        !player ||
        !contractSessionId ||
        currentView !== 'game' && currentView !== 'summary'
      ) {
        return;
      }

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
    // Generate random seed for this game
    const seed = Math.random().toString(36).substring(2, 15);
    setSeed(seed);
    setRoom('solo-room', 'SOLO');
    startGame();
    setCurrentView('game');
  };

  const handleRoomCreated = (roomId: string, roomCode: string) => {
    setCurrentRoomId(roomId);
    setCurrentRoomCode(roomCode);
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

      // Step 2: Set room ID FIRST to start Firebase subscription BEFORE joining
      // This ensures we receive updates from Firebase immediately after the join
      setCurrentRoomId(roomQuery.id);

      // Step 3: Actually join the room via Firebase
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

      // Step 4: Wait for Firebase subscription to update and transition to game
      // The useEffect at line 724-739 will handle the transition when room.status becomes 'ready'
      // In the meantime, show lobby view
      if (currentView === 'join-room') {
        setCurrentView('lobby');
      }
    } catch (error) {
      console.error('Error joining room:', error);
      showNotification('error', 'Join Error', 'An unexpected error occurred. Please try again.');
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
            onJoinRoom={() => setCurrentView('join-room')}
            onJoinRoomWithCode={handleJoinRoom}
            onPlaySolo={handlePlaySolo}
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

              // Determine player order: creator is player1, joiner is player2
              const player1 = isCreator ? player.address : opponentAddress;
              const player2 = isCreator ? opponentAddress : player.address;

              console.log('[Contract] Starting game on contract...', { player1, player2 });

              // Call contract start_game to lock bets and create session
              const result = await contractFlow.executeGameFlow({
                player1,
                player2,
                betAmount: betAmount,
                onGameStart: (txHash) => {
                  console.log('[Contract] Game started, tx:', txHash);
                },
              });

              if (result.success) {
                console.log('[Contract] Game started successfully');
                // Generate a session ID from the transaction hash or timestamp
                const sessionId = result.txHash
                  ? parseInt(result.txHash.replace('dev_', '').split('_')[1]) % 1000000
                  : Date.now() % 1000000;
                setContractSessionId(sessionId);
                showNotification('success', 'Game Started', 'Bets locked on contract. Good luck!');
              } else {
                console.error('[Contract] Failed to start game:', result.error);
                showNotification('warning', 'Contract Start Failed', 'Game starting without contract (dev mode)');
                // Still generate a session ID for local tracking
                setContractSessionId(Date.now() % 1000000);
              }

              startGame();
              setCurrentView('game');
            }}
          />
        ) : null;

      case 'game':
        return <GameContainer key={gameKey} />;

      case 'summary':
        // Summary is handled within GameContainer
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
