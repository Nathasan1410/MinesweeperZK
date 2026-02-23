'use client';

import { useState } from 'react';
import { RefreshCw, LogOut, Clock, Users } from 'lucide-react';
import { useRoomList, type FirebaseRoom } from '@/hooks/use-firebase-room';

interface LobbyPageProps {
  onCreateRoom: () => void;
  onJoinGame: (roomId?: string) => void;
  onDisconnect: () => void;
  onPlaySolo?: () => void;
  playerAddress?: string;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function timeRemaining(expiresAt: number): string {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return 'Expired';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function LobbyPage({ onCreateRoom, onJoinGame, onDisconnect, onPlaySolo, playerAddress }: LobbyPageProps) {
  const { rooms, loading, error } = useRoomList();
  const [filter, setFilter] = useState<'all' | 'waiting' | 'ready'>('all');

  const filteredRooms = rooms.filter(room => {
    if (filter === 'all') return true;
    return room.status === filter;
  });

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
          {playerAddress && (
            <div className="border border-border-color px-3 py-2 font-mono text-sm">
              <span className="text-secondary">{playerAddress.slice(0, 6)}...{playerAddress.slice(-4)}</span>
            </div>
          )}
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
        <div className="flex items-center gap-3">
          <button
            onClick={onCreateRoom}
            className="px-6 py-2 bg-success text-foreground font-semibold uppercase text-sm hover:opacity-90 transition-opacity"
            style={{ letterSpacing: '0.05em' }}
          >
            CREATE ROOM
          </button>

          {onPlaySolo && (
            <button
              onClick={onPlaySolo}
              className="px-6 py-2 border border-border-color text-secondary font-semibold uppercase text-sm hover:border-foreground hover:text-foreground transition-colors"
              style={{ letterSpacing: '0.05em' }}
            >
              SOLO PLAY
            </button>
          )}
        </div>

        {/* Filter Toggles */}
        <div className="flex items-center gap-2 ml-auto">
          {(['all', 'waiting', 'ready'] as const).map((f) => (
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
          <div className="grid grid-cols-6 gap-6 py-3 px-4 border-b border-border-color text-secondary text-sm font-semibold uppercase tracking-wide mb-1">
            <div>ROOM</div>
            <div>STAKE (XLM)</div>
            <div>HOST</div>
            <div>STATUS</div>
            <div>TIME LEFT</div>
            <div>ACTION</div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-12 text-center text-secondary text-sm">
              Loading rooms...
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="py-12 text-center text-sm" style={{ color: '#FF4444' }}>
              Failed to load rooms: {error.message}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredRooms.length === 0 && (
            <div className="py-12 text-center text-secondary text-sm space-y-2">
              <Users className="w-8 h-8 mx-auto opacity-40" />
              <p>No active rooms found</p>
              <p className="text-xs">Create a room or wait for others to join</p>
            </div>
          )}

          {/* Table Rows */}
          <div className="space-y-px">
            {filteredRooms.map((room) => {
              const isOwnRoom = playerAddress && room.creatorAddress === playerAddress;
              const canJoin = room.status === 'waiting' && !isOwnRoom;

              return (
                <div
                  key={room.id}
                  className="grid grid-cols-6 gap-6 py-3 px-4 hover:bg-surface transition-colors border-b border-border-color group"
                >
                  <div className="font-mono text-foreground font-semibold">
                    #{room.code}
                  </div>
                  <div className="font-mono text-foreground font-bold">
                    {room.betAmount} XLM
                  </div>
                  <div className="font-mono text-secondary">
                    {room.creatorAddress.slice(0, 6)}...{room.creatorAddress.slice(-4)}
                    {isOwnRoom && <span className="text-xs ml-1" style={{ color: '#FFA500' }}>(You)</span>}
                  </div>
                  <div
                    className={`font-semibold uppercase text-sm ${
                      room.status === 'waiting' ? 'text-warning' : 'text-success'
                    }`}
                    style={{ letterSpacing: '0.05em' }}
                  >
                    {room.status === 'waiting' ? 'WAITING' : 'READY'}
                  </div>
                  <div className="font-mono text-secondary text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeRemaining(room.expiresAt)}
                  </div>
                  <button
                    onClick={canJoin ? () => onJoinGame(room.id) : undefined}
                    disabled={!canJoin}
                    className={`px-3 py-1 border font-semibold uppercase text-sm transition-colors ${
                      canJoin
                        ? 'border-success text-success hover:bg-success hover:text-background cursor-pointer'
                        : 'border-border-color text-secondary cursor-not-allowed opacity-50'
                    }`}
                    style={{ letterSpacing: '0.05em' }}
                  >
                    {isOwnRoom ? 'YOUR ROOM' : canJoin ? 'JOIN' : room.status === 'ready' ? 'FULL' : 'JOIN'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
