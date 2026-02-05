
import React from 'react';
import { PieceData } from '../types';
import { COLOR_MAP } from '../constants';

interface NeonPieceProps {
  piece: PieceData;
  isSelected?: boolean;
}

const NeonPiece: React.FC<NeonPieceProps> = ({ piece, isSelected }) => {
  const colors = COLOR_MAP[piece.color];
  const isBomb = piece.color === 'bomb';

  return (
    <div className={`relative w-full h-full flex items-center justify-center p-1 cursor-pointer select-none ${piece.isMatched ? 'animate-pop-out' : ''}`}>
      <div 
        className={`
          w-full h-full rounded-full transition-all duration-200
          ${colors.bg} ${colors.border} ${isBomb ? 'border-[3px]' : 'border-2'}
          piece-shadow flex items-center justify-center
          ${isSelected ? 'scale-110 border-white shadow-[0_0_15px_white]' : 'active:scale-90'}
          ${isBomb ? 'animate-diamond' : ''}
        `}
        style={{
          // Brilho ajustado para 0.8 (aumento de 30% em relação ao ajuste anterior de 0.5)
          filter: 'brightness(0.8) saturate(1.2)',
          boxShadow: `0 0 12px ${colors.glow}, inset 0 -4px 8px rgba(0,0,0,0.4), inset 0 4px 6px rgba(255,255,255,0.2)`,
          backdropFilter: isBomb ? 'blur(4px)' : 'none'
        }}
      >
        {isBomb ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <span className="text-xl drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] z-10">💎</span>
            <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse scale-75 blur-sm" />
          </div>
        ) : (
          /* Shine/Specular Highlight */
          <div className="absolute top-1 left-1.5 w-1/3 h-1/4 bg-white/30 rounded-full blur-[1px]" />
        )}
      </div>
    </div>
  );
};

export default NeonPiece;
