
export type PieceColor = 'green' | 'yellow' | 'pink' | 'purple' | 'cyan' | 'bomb';

export interface PieceData {
  color: PieceColor;
  isSpecial: boolean;
  id: string; 
  isMatched?: boolean; // Nova flag para animação de sumiço
}

export type GameStatus = 'MENU' | 'PLAYING' | 'GAMEOVER';

export interface GameState {
  score: number;
  moves: number;
  timeLeft: number;
  difficulty: 'Fácil' | 'Difícil';
  grid: (PieceData | null)[][];
  status: GameStatus;
}
