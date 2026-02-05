
import React from 'react';
import { Bomb, Zap, Hammer } from 'lucide-react';

interface PowerUpButtonProps {
  type: 'bomb' | 'lightning' | 'hammer';
  count: number;
  isActive?: boolean;
  onClick: () => void;
}

const PowerUpButton: React.FC<PowerUpButtonProps> = ({ type, count, isActive, onClick }) => {
  const getIcon = () => {
    switch (type) {
      case 'bomb': return <Bomb className="w-6 h-6 text-orange-500" />;
      case 'lightning': return <Zap className="w-6 h-6 text-yellow-400" />;
      case 'hammer': return <Hammer className="w-6 h-6 text-blue-400" />;
    }
  };

  const getGlowColor = () => {
    if (isActive) {
      switch (type) {
        case 'bomb': return 'shadow-[0_0_25px_rgba(249,115,22,0.8)] border-orange-500 scale-110';
        case 'lightning': return 'shadow-[0_0_25px_rgba(250,204,21,0.8)] border-yellow-400 scale-110';
        case 'hammer': return 'shadow-[0_0_25px_rgba(96,165,250,0.8)] border-blue-400 scale-110';
      }
    }
    switch (type) {
      case 'bomb': return 'shadow-[0_0_15px_rgba(249,115,22,0.3)] border-white/20 hover:border-orange-500/50';
      case 'lightning': return 'shadow-[0_0_15px_rgba(250,204,21,0.3)] border-white/20 hover:border-yellow-400/50';
      case 'hammer': return 'shadow-[0_0_15px_rgba(96,165,250,0.3)] border-white/20 hover:border-blue-400/50';
    }
  };

  return (
    <div className="relative group">
      <button 
        onClick={onClick}
        disabled={count <= 0 && !isActive}
        className={`
          glass w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2
          ${getGlowColor()} ${count <= 0 && !isActive ? 'opacity-40 grayscale cursor-not-allowed' : 'active:scale-95'}
        `}
      >
        {getIcon()}
      </button>
      {count >= 0 && (
        <div className={`absolute -top-1 -right-1 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0f172a] shadow-lg transition-colors
          ${isActive ? 'bg-white text-black' : 'bg-cyan-500 text-white'}
        `}>
          {count}
        </div>
      )}
    </div>
  );
};

export default PowerUpButton;
