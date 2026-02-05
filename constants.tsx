
import { PieceColor } from './types';

export const GRID_SIZE = 8;
export const INITIAL_MOVES = 0;
export const INITIAL_TIME = 60;

export const PIECE_COLORS: PieceColor[] = ['green', 'yellow', 'pink', 'purple', 'cyan'];

export const COLOR_MAP: Record<PieceColor, { bg: string; glow: string; border: string }> = {
  green: {
    bg: 'bg-green-400',
    glow: 'rgba(74, 222, 128, 0.8)',
    border: 'border-green-300'
  },
  yellow: {
    bg: 'bg-yellow-400',
    glow: 'rgba(250, 204, 21, 0.8)',
    border: 'border-yellow-200'
  },
  pink: {
    bg: 'bg-pink-500',
    glow: 'rgba(236, 72, 153, 0.8)',
    border: 'border-pink-300'
  },
  purple: {
    bg: 'bg-purple-600',
    glow: 'rgba(147, 51, 234, 0.8)',
    border: 'border-purple-400'
  },
  cyan: {
    bg: 'bg-cyan-400',
    glow: 'rgba(34, 211, 238, 0.8)',
    border: 'border-cyan-200'
  },
  bomb: {
    bg: 'bg-gradient-to-br from-white/20 via-cyan-200/30 to-white/10',
    glow: 'rgba(255, 255, 255, 1)',
    border: 'border-white/60'
  }
};
