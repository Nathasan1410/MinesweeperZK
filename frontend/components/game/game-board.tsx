/**
 * Game Board Component
 * Main minesweeper board with grid layout
 */

'use client';

import { memo } from 'react';
import { Flag, Bomb } from 'lucide-react';
import { useGameBoard, useMinesweeperGame } from '@/hooks/use-minesweeper-game';
import { GameCell } from './game-cell';
import { GAME_CONFIG, THEME_COLORS } from '@/lib/game/types';

const GameBoardComponent = () => {
  const { minefield, onCellClick, actionMode, showHint, canPlay } = useGameBoard();

  const { GRID_SIZE } = GAME_CONFIG;

  return (
    <div className="flex flex-col items-center justify-center p-4" data-testid="game-board">
      <div
        className="bg-surface border-2 border-border rounded-lg p-2 shadow-xl"
        style={{
          maxWidth: '100%',
          aspectRatio: '1',
        }}
      >
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: "repeat(" + GRID_SIZE + ", minmax(0, 1fr))",
            gridTemplateRows: "repeat(" + GRID_SIZE + ", minmax(0, 1fr))",
          }}
        >
          {minefield.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={x + "-" + y}
                className="aspect-square"
                style={{
                  minWidth: '32px',
                  minHeight: '32px',
                }}
              >
                <GameCell
                  cell={cell}
                  onClick={() => onCellClick(x, y)}
                  onRightClick={() => onCellClick(x, y)}
                  disabled={!canPlay}
                  showHint={showHint}
                  actionMode={actionMode}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-textSecondary">
        <p>
          {actionMode === 'reveal' ? (
            <>Click to dig • Right-click to flag</>
          ) : (
            <>Click to flag • Right-click to dig</>
          )}
        </p>
        <p className="text-xs mt-1 opacity-70">
          {showHint ? 'Hints enabled - safe cells are tinted green' : 'Toggle hints to see safe cells'}
        </p>
      </div>
    </div>
  );
};

export const GameBoard = memo(GameBoardComponent);

const CompactGameBoardComponent = () => {
  const { minefield, onCellClick, actionMode, showHint, canPlay } = useGameBoard();

  const { GRID_SIZE } = GAME_CONFIG;

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div
        className="bg-surface border-2 border-border rounded-lg p-1 shadow-xl"
        style={{
          maxWidth: '100%',
          width: '100%',
          aspectRatio: '1',
        }}
      >
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: "repeat(" + GRID_SIZE + ", minmax(0, 1fr))",
            gridTemplateRows: "repeat(" + GRID_SIZE + ", minmax(0, 1fr))",
          }}
        >
          {minefield.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={x + "-" + y}
                className="aspect-square"
              >
                <GameCell
                  cell={cell}
                  onClick={() => onCellClick(x, y)}
                  disabled={!canPlay}
                  showHint={showHint}
                  actionMode={actionMode}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const CompactGameBoard = memo(CompactGameBoardComponent);

interface OpponentBoardProps {
  title?: string;
  opponentMinefield?: import('@/lib/game/types').Minefield | null;
}

const OpponentBoardComponent = ({ title = "Opponent's Board", opponentMinefield: propMinefield }: OpponentBoardProps) => {
  const { opponentMinefield: storeMinefield } = useMinesweeperGame();
  const field = propMinefield ?? storeMinefield;

  if (!field) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="text-center text-textSecondary">
          <p className="text-sm">Waiting for opponent to finish...</p>
        </div>
      </div>
    );
  }

  const { GRID_SIZE } = GAME_CONFIG;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h3 className="text-lg font-semibold text-textPrimary mb-3">{title}</h3>

      <div
        className="bg-surface border border-border rounded-lg p-2"
        style={{
          maxWidth: '200px',
        }}
      >
        <div
          className="grid gap-0.5"
          style={{
            gridTemplateColumns: "repeat(" + GRID_SIZE + ", minmax(0, 1fr))",
          }}
        >
          {field.map((row, y) =>
            row.map((cell, x) => (
              <div key={x + "-" + y} className="aspect-square">
                <div
                  className="w-full h-full flex items-center justify-center text-xs border"
                  style={{
                    backgroundColor:
                      cell.state === 'revealed'
                        ? cell.value === -1
                          ? '#DA4F49'
                          : '#2A2A2C'
                        : '#1A1A1B',
                    borderColor: '#3A3A3C',
                    color: cell.value === -1 ? '#000' : '#F8F9FA',
                  }}
                >
                  {cell.state === 'flagged' && <Flag className="w-3 h-3" />}
                  {cell.state === 'revealed' && cell.value === -1 && <Bomb className="w-3 h-3" />}
                  {cell.state === 'revealed' && cell.value > 0 && cell.value}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const OpponentBoard = memo(OpponentBoardComponent);

const BoardComparisonComponent = () => {
  const { myMinefield, opponentMinefield } = useMinesweeperGame();

  const { GRID_SIZE } = GAME_CONFIG;

  if (!opponentMinefield) {
    return <GameBoard />;
  }

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 p-4">
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold text-safe mb-3">Your Board</h3>
        <div
          className="bg-surface border-2 border-safe rounded-lg p-2 shadow-lg"
          style={{ maxWidth: '300px' }}
        >
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: "repeat(" + GRID_SIZE + ", minmax(0, 1fr))",
            }}
          >
            {myMinefield.map((row, y) =>
              row.map((cell, x) => (
                <div key={x + "-" + y} className="aspect-square min-w-8 min-h-8">
                  <GameCell cell={cell} onClick={() => {}} disabled />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold text-flag mb-3">Opponent's Board</h3>
        <div
          className="bg-surface border-2 border-flag rounded-lg p-2 shadow-lg"
          style={{ maxWidth: '300px' }}
        >
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: "repeat(" + GRID_SIZE + ", minmax(0, 1fr))",
            }}
          >
            {opponentMinefield.map((row, y) =>
              row.map((cell, x) => (
                <div key={x + "-" + y} className="aspect-square min-w-8 min-h-8">
                  <GameCell cell={cell} onClick={() => {}} disabled />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2"
          style={{
            backgroundColor: THEME_COLORS.surface,
            borderColor: THEME_COLORS.border,
            color: THEME_COLORS.textPrimary,
          }}
        >
          VS
        </div>
      </div>
    </div>
  );
};

export const BoardComparison = memo(BoardComparisonComponent);
