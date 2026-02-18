'use client';

import { useState } from 'react';
import { RefreshCw, LogOut } from 'lucide-react';

interface LobbyPageProps {
  onCreateRoom: () => void;
  onJoinGame: () => void;
  onDisconnect: () => void;
}

interface Room {
  id: string;
  stake: string;
  host: string;
  status: 'WAITING' | 'PLAYING';
}

const mockRooms: Room[] = [
  { id: '#A4F1', stake: '10.0', host: 'GDB...2A', status: 'WAITING' },
  { id: '#B7E2', stake: '25.0', host: 'XYZ...8F', status: 'PLAYING' },
  { id: '#C9D3', stake: '50.0', host: 'ABC...3K', status: 'WAITING' },
  { id: '#D1F5', stake: '100.0', host: 'PQR...7L', status: 'PLAYING' },
  { id: '#E6M2', stake: '5.0', host: 'LMN...9Q', status: 'WAITING' },
];

export function LobbyPage({ onCreateRoom, onJoinGame, onDisconnect }: LobbyPageProps) {
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <div className="border-b border-border-color px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold tracking-widest" style={{ letterSpacing: '0.2em' }}>
            MINESWEEPER.ZK
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {/* Wallet Badge */}
          <div className="border border-border-color px-3 py-2 font-mono text-sm">
            <span className="text-foreground">500 XLM</span>
            <span className="text-secondary mx-2">|</span>
            <span className="text-secondary">0x12...8F</span>
          </div>
          <button
            onClick={onDisconnect}
            className="p-2 hover:bg-surface transition-colors"
            title="Disconnect"
          >
            <LogOut className="w-4 h-4 text-secondary" />
          </button>
        </div>
      </div>

      {/* Action Area */}
      <div className="border-b border-border-color px-6 py-4 flex items-center justify-between gap-4">
        <button
          onClick={onCreateRoom}
          className="px-6 py-2 bg-success text-foreground font-semibold uppercase text-sm hover:opacity-90 transition-opacity"
          style={{ letterSpacing: '0.05em' }}
        >
          CREATE ROOM
        </button>

        <button
          className="p-2 hover:bg-surface transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-secondary" />
        </button>

        {/* Filter Toggles */}
        <div className="flex items-center gap-2 ml-auto">
          {(['all', 'public', 'private'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 border text-sm uppercase font-medium transition-colors ${
                filter === f
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border-color text-secondary hover:border-foreground'
              }`}
              style={{ letterSpacing: '0.05em' }}
            >
              [{f}]
            </button>
          ))}
        </div>
      </div>

      {/* Room List Table */}
      <div className="flex-1 overflow-x-auto px-6 py-4">
        <div className="min-w-full">
          {/* Table Headers */}
          <div className="grid grid-cols-5 gap-6 py-3 px-4 border-b border-border-color text-secondary text-sm font-semibold uppercase tracking-wide mb-1">
            <div>ROOM ID</div>
            <div>STAKE (XLM)</div>
            <div>HOST</div>
            <div>STATUS</div>
            <div>ACTION</div>
          </div>

          {/* Table Rows */}
          <div className="space-y-px">
            {mockRooms.map((room) => (
              <div
                key={room.id}
                className="grid grid-cols-5 gap-6 py-3 px-4 hover:bg-surface transition-colors border-b border-border-color group"
              >
                <div className="font-mono text-foreground font-semibold">{room.id}</div>
                <div className="font-mono text-foreground font-bold">{room.stake} XLM</div>
                <div className="font-mono text-secondary">{room.host}</div>
                <div
                  className={`font-semibold uppercase text-sm ${
                    room.status === 'WAITING' ? 'text-warning' : 'text-secondary'
                  }`}
                  style={{ letterSpacing: '0.05em' }}
                >
                  {room.status}
                </div>
                <button
                  onClick={room.status === 'WAITING' ? onJoinGame : undefined}
                  className={`px-3 py-1 border font-semibold uppercase text-sm transition-colors ${
                    room.status === 'WAITING'
                      ? 'border-success text-success hover:bg-success hover:text-background cursor-pointer'
                      : 'border-border-color text-secondary hover:border-foreground'
                  }`}
                  style={{ letterSpacing: '0.05em' }}
                >
                  {room.status === 'WAITING' ? 'JOIN' : 'WATCH'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
