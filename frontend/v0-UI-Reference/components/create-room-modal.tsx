'use client';

import { useState } from 'react';
import { Lock, Copy } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('');
  const [betAmount, setBetAmount] = useState(10);
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomCode, setRoomCode] = useState('ABC123');

  if (!isOpen) return null;

  const betPresets = [5, 10, 50, 100];

  const handleCreate = () => {
    // Handle room creation
    onClose();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface border border-border-color w-full max-w-md p-6 space-y-6">
        {/* Modal Title */}
        <h2 className="text-lg font-bold uppercase tracking-wide" style={{ letterSpacing: '0.05em' }}>
          Create Room
        </h2>

        {/* Room Name Field */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold uppercase text-secondary" style={{ letterSpacing: '0.05em' }}>
            Room Name
          </label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
            className="w-full px-3 py-2 bg-background border border-border-color text-foreground placeholder-secondary focus:outline-none focus:border-foreground transition-colors"
          />
        </div>

        {/* Bet Amount Field */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold uppercase text-secondary" style={{ letterSpacing: '0.05em' }}>
            Bet Amount
          </label>
          <div className="grid grid-cols-4 gap-2">
            {betPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => setBetAmount(preset)}
                className={`px-2 py-2 border font-mono font-semibold text-sm transition-colors ${
                  betAmount === preset
                    ? 'bg-success text-foreground border-success'
                    : 'border-border-color text-secondary hover:border-foreground'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="text-center py-3 bg-background border border-border-color">
            <div className="font-mono text-3xl font-bold text-foreground">{betAmount}</div>
            <div className="text-xs text-secondary mt-1">XLM</div>
          </div>
        </div>

        {/* Privacy Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold uppercase text-secondary" style={{ letterSpacing: '0.05em' }}>
              Privacy
            </label>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative w-12 h-6 border transition-colors ${
                isPrivate ? 'bg-success border-success' : 'bg-background border-border-color'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-foreground transition-transform ${
                  isPrivate ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Room Code (appears when private) */}
          {isPrivate && (
            <div className="space-y-2 pt-2 border-t border-border-color">
              <label className="block text-xs font-semibold uppercase text-secondary" style={{ letterSpacing: '0.05em' }}>
                Room Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomCode}
                  readOnly
                  className="flex-1 px-3 py-2 bg-background border border-border-color text-foreground font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-2 border border-border-color text-secondary hover:border-foreground transition-colors flex items-center justify-center"
                  title="Copy code"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border-color">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-secondary font-semibold uppercase hover:text-foreground transition-colors"
            style={{ letterSpacing: '0.05em' }}
          >
            CANCEL
          </button>
          <button
            onClick={handleCreate}
            className="flex-1 py-2 bg-success text-foreground font-semibold uppercase hover:opacity-90 transition-opacity"
            style={{ letterSpacing: '0.05em' }}
          >
            CREATE & DEPOSIT
          </button>
        </div>
      </div>
    </div>
  );
}
