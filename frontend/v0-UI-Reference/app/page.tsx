'use client';

import { useState } from 'react';
import { LandingPage } from '@/components/landing-page';
import { LobbyPage } from '@/components/lobby-page';
import { CreateRoomModal } from '@/components/create-room-modal';
import { GameplayArena } from '@/components/gameplay-arena';
import { SummaryVerdict } from '@/components/summary-verdict';

type AppView = 'landing' | 'lobby' | 'gameplay' | 'summary';

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gameResult, setGameResult] = useState<{
    isWinner: boolean;
    winAmount: number;
  }>({ isWinner: true, winAmount: 19.5 });

  const handleConnectWallet = () => {
    setCurrentView('lobby');
  };

  const handleDisconnect = () => {
    setCurrentView('landing');
  };

  const handleJoinGame = () => {
    setCurrentView('gameplay');
  };

  const handleGameEnd = (isWinner: boolean, winAmount: number) => {
    setGameResult({ isWinner, winAmount });
    setCurrentView('summary');
  };

  const handleExitGame = () => {
    setCurrentView('lobby');
  };

  return (
    <main className="min-h-screen bg-background">
      {currentView === 'landing' && (
        <LandingPage onConnectWallet={handleConnectWallet} />
      )}
      {currentView === 'lobby' && (
        <>
          <LobbyPage
            onCreateRoom={() => setShowCreateModal(true)}
            onJoinGame={handleJoinGame}
            onDisconnect={handleDisconnect}
          />
          <CreateRoomModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />
        </>
      )}
      {currentView === 'gameplay' && (
        <GameplayArena onGameEnd={handleGameEnd} />
      )}
      {currentView === 'summary' && (
        <SummaryVerdict
          isWinner={gameResult.isWinner}
          winAmount={gameResult.winAmount}
          gameId="8F2A"
          totalMoves={14}
          seedHash="0x82a7f5c9b2e4d1f6a8c3e9b7d2f5a1c9b8e4f2a5c3d1e9b7f5a2c8d6e4f1a9"
          txHash="0x7b3e9c2f5a8d1e4c7f9a2b5e8d1c4f7a9b2e5c8d1f4a7b9e2c5f8a1d4e7c2d"
          board={Array(8).fill(Array(8).fill(0))}
          playerFlags={Array(8).fill(Array(8).fill(false))}
          onFindNewMatch={() => setCurrentView('lobby')}
          onBackToLobby={() => setCurrentView('lobby')}
        />
      )}
    </main>
  );
}
