
import React, { useRef } from 'react';
import { GameState } from '../types';
import NeonPiece from './NeonPiece';

interface GameBoardProps {
  gameState: GameState;
  onSelectPiece: (row: number, col: number) => void;
  onSwipe: (row: number, col: number, direction: 'up' | 'down' | 'left' | 'right') => void;
  selectedPos: { r: number; c: number } | null;
  isExploding?: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, onSelectPiece, onSwipe, selectedPos, isExploding }) => {
  const dragStartPos = useRef<{ r: number; c: number; x: number; y: number } | null>(null);
  const swipeThreshold = 30; // pixels para detectar o arraste

  const handlePointerDown = (e: React.PointerEvent, r: number, c: number) => {
    // Captura o ponteiro para garantir que o movimento seja rastreado mesmo fora da peça
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartPos.current = { r, c, x: e.clientX, y: e.clientY };
    
    // Seleciona a peça visualmente imediatamente
    onSelectPiece(r, c);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartPos.current) return;

    const { r, c, x: startX, y: startY } = dragStartPos.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > swipeThreshold || Math.abs(dy) > swipeThreshold) {
      let direction: 'up' | 'down' | 'left' | 'right';

      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }

      onSwipe(r, c, direction);
      dragStartPos.current = null; // Cancela o resto do rastro para evitar múltiplos swipes
    }
  };

  const handlePointerUp = () => {
    dragStartPos.current = null;
  };

  return (
    <div className={`relative w-full aspect-square max-w-[420px] mx-auto touch-none ${isExploding ? 'animate-shake' : ''}`}>
      {/* Outer Board Glow */}
      <div className="absolute -inset-1 bg-cyan-400/20 blur-xl rounded-2xl" />
      
      <div 
        className="relative glass neon-border rounded-2xl p-2 grid grid-cols-8 grid-rows-8 gap-1 w-full h-full overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        {/* Grid Background Lines */}
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 pointer-events-none opacity-5">
          {Array.from({ length: 64 }).map((_, i) => (
            <div key={i} className="border border-white/20" />
          ))}
        </div>

        {gameState.grid.map((row, rIdx) => 
          row.map((piece, cIdx) => (
            <div 
              key={piece?.id || `empty-${rIdx}-${cIdx}`}
              onPointerDown={(e) => handlePointerDown(e, rIdx, cIdx)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full h-full"
            >
              {piece && (
                <NeonPiece 
                  piece={piece} 
                  isSelected={selectedPos?.r === rIdx && selectedPos?.c === cIdx}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GameBoard;
