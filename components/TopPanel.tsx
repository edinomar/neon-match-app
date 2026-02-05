
import React from 'react';
import { Star, RefreshCw } from 'lucide-react';

interface TopPanelProps {
  score: number;
  difficulty: string;
  moves: number;
}

const TopPanel: React.FC<TopPanelProps> = ({ score, difficulty, moves }) => {
  return (
    <div className="glass neon-border rounded-3xl p-4 flex items-center justify-between w-full max-w-md mx-auto shadow-2xl">
      {/* Score Section */}
      <div className="flex flex-col items-center flex-1">
        <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Pontuação</span>
        <div className="flex items-center gap-1">
          <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
          <span className="text-xl font-bold text-white leading-none">{score}</span>
        </div>
      </div>

      {/* Difficulty Section */}
      <div className="flex flex-col items-center flex-1 px-4">
        <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider mb-1">Dificuldade</span>
        <div className="bg-cyan-500/20 px-4 py-1.5 rounded-full border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
          <span className="text-sm font-bold text-white neon-text-green">{difficulty}</span>
        </div>
      </div>

      {/* Moves Section */}
      <div className="flex flex-col items-center flex-1">
        <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Movimentos</span>
        <div className="flex items-center gap-1">
          <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin-slow" style={{ animationDuration: '8s' }} />
          <span className="text-xl font-bold text-white leading-none">{moves}</span>
        </div>
      </div>
    </div>
  );
};

export default TopPanel;
