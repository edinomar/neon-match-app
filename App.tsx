
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ParticleBackground from './components/ParticleBackground';
import TopPanel from './components/TopPanel';
import GameBoard from './components/GameBoard';
import PowerUpButton from './components/PowerUpButton';
import { GameStatus, PieceColor, PieceData } from './types';
import { PIECE_COLORS, GRID_SIZE, INITIAL_MOVES, INITIAL_TIME } from './constants';
import { Vibrate, VibrateOff } from 'lucide-react';

type PowerUpType = 'bomb' | 'lightning' | 'hammer' | null;

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('MENU');
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Difícil'>('Fácil');
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(INITIAL_MOVES);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [grid, setGrid] = useState<(PieceData | null)[][]>([]);
  const [selectedPos, setSelectedPos] = useState<{ r: number; c: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isExplodingEffect, setIsExplodingEffect] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  const [activePowerUp, setActivePowerUp] = useState<PowerUpType>(null);
  const [inventory, setInventory] = useState({
    bomb: 2,
    lightning: 2,
    hammer: 3
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sistema de Vibração Refinado
  const triggerVibration = useCallback((type: 'light' | 'medium' | 'heavy') => {
    if (!hapticEnabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
    
    // Aumentamos os valores pois alguns Androids ignoram vibrações < 30ms
    switch (type) {
      case 'light': 
        navigator.vibrate(35); 
        break;
      case 'medium': 
        navigator.vibrate(60); 
        break;
      case 'heavy': 
        // Padrão: vibra, para, vibra forte
        navigator.vibrate([100, 50, 150]); 
        break;
    }
  }, [hapticEnabled]);

  const generatePiece = useCallback((colorOverride?: PieceColor): PieceData => ({
    color: colorOverride || PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)],
    isSpecial: false,
    id: Math.random().toString(36).substr(2, 9)
  }), []);

  const createInitialGrid = useCallback(() => {
    let newGrid: (PieceData | null)[][] = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => generatePiece())
    );

    let hasMatches = true;
    while (hasMatches) {
      hasMatches = false;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const type = newGrid[r][c]?.color;
          if (!type) continue;
          if (c < GRID_SIZE - 2 && newGrid[r][c + 1]?.color === type && newGrid[r][c + 2]?.color === type) {
            newGrid[r][c] = generatePiece();
            hasMatches = true;
          }
          if (r < GRID_SIZE - 2 && newGrid[r + 1][c]?.color === type && newGrid[r + 2][c]?.color === type) {
            newGrid[r][c] = generatePiece();
            hasMatches = true;
          }
        }
      }
    }
    return newGrid;
  }, [generatePiece]);

  const findMatches = (currentGrid: (PieceData | null)[][]) => {
    const matchedCoords: { r: number; c: number }[] = [];
    const matchedSet = new Set<string>();

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const p1 = currentGrid[r][c];
        const p2 = currentGrid[r][c + 1];
        const p3 = currentGrid[r][c + 2];
        if (p1 && p2 && p3 && p1.color === p2.color && p2.color === p3.color && p1.color !== 'bomb' && !p1.isMatched) {
          [c, c + 1, c + 2].forEach(col => {
            const key = `${r}-${col}`;
            if (!matchedSet.has(key)) {
              matchedCoords.push({ r, c: col });
              matchedSet.add(key);
            }
          });
        }
      }
    }

    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        const p1 = currentGrid[r][c];
        const p2 = currentGrid[r + 1][c];
        const p3 = currentGrid[r + 2][c];
        if (p1 && p2 && p3 && p1.color === p2.color && p2.color === p3.color && p1.color !== 'bomb' && !p1.isMatched) {
          [r, r + 1, r + 2].forEach(row => {
            const key = `${row}-${c}`;
            if (!matchedSet.has(key)) {
              matchedCoords.push({ r: row, c });
              matchedSet.add(key);
            }
          });
        }
      }
    }

    return matchedCoords;
  };

  const resolveBoard = async (startGrid: (PieceData | null)[][]) => {
    let currentGrid = startGrid.map(row => [...row]);
    let totalMatched = 0;

    while (true) {
      const matches = findMatches(currentGrid);
      const pendingToRemove: { r: number; c: number }[] = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (currentGrid[r][c]?.isMatched) {
            pendingToRemove.push({ r, c });
          }
        }
      }

      if (matches.length === 0 && pendingToRemove.length === 0) break;

      if (matches.length > 0) triggerVibration('medium');

      const initialBatch = [...matches];
      pendingToRemove.forEach(p => {
        if (!initialBatch.some(m => m.r === p.r && m.c === p.c)) {
          initialBatch.push(p);
        }
      });

      const isLargeMatch = matches.length >= 4;
      const bombCreationPos = isLargeMatch ? { ...matches[0] } : null;

      const finalToRemove = [...initialBatch];
      initialBatch.forEach(m => {
        const piece = currentGrid[m.r][m.c];
        if (piece?.color === 'bomb') {
          triggerVibration('heavy');
          setIsExplodingEffect(true);
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = m.r + dr, nc = m.c + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
                if (!finalToRemove.some(rem => rem.r === nr && rem.c === nc)) {
                  finalToRemove.push({ r: nr, c: nc });
                }
              }
            }
          }
        }
      });

      finalToRemove.forEach(m => {
        if (currentGrid[m.r][m.c]) {
          currentGrid[m.r][m.c] = { ...currentGrid[m.r][m.c]!, isMatched: true };
        }
      });
      setGrid(currentGrid.map(row => [...row]));
      
      await new Promise(r => setTimeout(r, 400));
      setIsExplodingEffect(false);

      finalToRemove.forEach(m => {
        currentGrid[m.r][m.c] = null;
      });

      if (bombCreationPos) {
        currentGrid[bombCreationPos.r][bombCreationPos.c] = { 
          color: 'bomb', 
          isSpecial: true, 
          id: Math.random().toString(36).substr(2, 9) 
        };
      }

      totalMatched += finalToRemove.length;
      setScore(prev => prev + finalToRemove.length);
      
      if (difficulty === 'Difícil') {
        setTimeLeft(prev => Math.min(INITIAL_TIME, prev + Math.floor(finalToRemove.length / 2)));
      }

      setGrid(currentGrid.map(row => [...row]));
      await new Promise(r => setTimeout(r, 100));

      for (let c = 0; c < GRID_SIZE; c++) {
        let emptySpot = GRID_SIZE - 1;
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (currentGrid[r][c] !== null) {
            if (emptySpot !== r) {
              currentGrid[emptySpot][c] = currentGrid[r][c];
              currentGrid[r][c] = null;
            }
            emptySpot--;
          }
        }
      }

      setGrid(currentGrid.map(row => [...row]));
      await new Promise(r => setTimeout(r, 150));

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (currentGrid[r][c] === null) {
            currentGrid[r][c] = generatePiece();
          }
        }
      }
      setGrid(currentGrid.map(row => [...row]));
      await new Promise(r => setTimeout(r, 150));
    }

    return totalMatched;
  };

  const handleSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isAnimating || r2 < 0 || r2 >= GRID_SIZE || c2 < 0 || c2 >= GRID_SIZE) return;

    triggerVibration('light');
    setIsAnimating(true);
    let workingGrid = grid.map(row => [...row]);
    const p1 = workingGrid[r1][c1];
    const p2 = workingGrid[r2][c2];
    
    workingGrid[r1][c1] = p2;
    workingGrid[r2][c2] = p1;
    setGrid(workingGrid.map(row => [...row]));

    await new Promise(r => setTimeout(r, 300));

    const matches = findMatches(workingGrid);
    const manualBombTrigger = (p1?.color === 'bomb' || p2?.color === 'bomb');

    if (matches.length > 0 || manualBombTrigger) {
      setMoves(prev => prev + 1);
      
      if (manualBombTrigger) {
        const bombPos = p1?.color === 'bomb' ? {r: r2, c: c2} : {r: r1, c: c1};
        for(let dr=-1; dr<=1; dr++) {
          for(let dc=-1; dc<=1; dc++) {
            const nr = bombPos.r + dr, nc = bombPos.c + dc;
            if(nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
              if (workingGrid[nr][nc]) {
                workingGrid[nr][nc] = { ...workingGrid[nr][nc]!, isMatched: true };
              }
            }
          }
        }
      }

      await resolveBoard(workingGrid);
    } else {
      workingGrid[r1][c1] = p1;
      workingGrid[r2][c2] = p2;
      setGrid(workingGrid.map(row => [...row]));
      await new Promise(r => setTimeout(r, 300));
    }
    
    setIsAnimating(false);
  };

  const handleSwipe = (r: number, c: number, direction: 'up' | 'down' | 'left' | 'right') => {
    if (isAnimating || status !== 'PLAYING') return;
    handleSwap(r, c, 
      direction === 'up' ? r - 1 : direction === 'down' ? r + 1 : r,
      direction === 'left' ? c - 1 : direction === 'right' ? c + 1 : c
    );
    setSelectedPos(null);
  };

  const usePowerUp = async (type: PowerUpType, r: number, c: number) => {
    if (isAnimating) return;
    
    triggerVibration('heavy');
    setIsAnimating(true);
    let workingGrid = grid.map(row => [...row]);
    const targetPiece = workingGrid[r][c];

    if (!targetPiece) {
      setIsAnimating(false);
      return;
    }

    setMoves(prev => prev + 1);

    switch (type) {
      case 'hammer':
        workingGrid[r][c] = { ...targetPiece, isMatched: true };
        setInventory(prev => ({ ...prev, hammer: prev.hammer - 1 }));
        break;
      
      case 'bomb':
        setIsExplodingEffect(true);
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
              if (workingGrid[nr][nc]) {
                workingGrid[nr][nc] = { ...workingGrid[nr][nc]!, isMatched: true };
              }
            }
          }
        }
        setInventory(prev => ({ ...prev, bomb: prev.bomb - 1 }));
        break;

      case 'lightning':
        const targetColor = targetPiece.color;
        workingGrid.forEach((row, ri) => {
          row.forEach((piece, ci) => {
            if (piece?.color === targetColor) {
              workingGrid[ri][ci] = { ...piece, isMatched: true };
            }
          });
        });
        setInventory(prev => ({ ...prev, lightning: prev.lightning - 1 }));
        break;
    }

    setActivePowerUp(null);
    setGrid(workingGrid);
    await resolveBoard(workingGrid);
    setIsAnimating(false);
  };

  const handleSelectPiece = (r: number, c: number) => {
    if (isAnimating || status !== 'PLAYING') return;
    triggerVibration('light');

    if (activePowerUp) {
      usePowerUp(activePowerUp, r, c);
      return;
    }

    if (!selectedPos) {
      setSelectedPos({ r, c });
    } else {
      const { r: sr, c: sc } = selectedPos;
      const isAdjacent = (Math.abs(r - sr) === 1 && c === sc) || (Math.abs(c - sc) === 1 && r === sr);

      if (isAdjacent) {
        handleSwap(sr, sc, r, c);
      }
      setSelectedPos(null);
    }
  };

  const togglePowerUp = (type: PowerUpType) => {
    if (status !== 'PLAYING' || isAnimating) return;
    triggerVibration('light');
    if (activePowerUp === type) {
      setActivePowerUp(null);
    } else if (inventory[type as keyof typeof inventory] > 0) {
      setActivePowerUp(type);
      setSelectedPos(null);
    }
  };

  const toggleHaptic = () => {
    const newState = !hapticEnabled;
    setHapticEnabled(newState);
    if (newState) {
      // Pequeno teste de vibração ao ativar
      setTimeout(() => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
           navigator.vibrate([30, 50, 30]);
        }
      }, 50);
    }
  };

  const startGame = (diff: 'Fácil' | 'Difícil') => {
    triggerVibration('medium');
    setDifficulty(diff);
    setScore(0);
    setMoves(0);
    setTimeLeft(INITIAL_TIME);
    setGrid(createInitialGrid());
    setStatus('PLAYING');
    setSelectedPos(null);
    setActivePowerUp(null);
    setInventory({ bomb: 2, lightning: 2, hammer: 3 });
    setIsAnimating(false);
  };

  useEffect(() => {
    if (status === 'PLAYING' && difficulty === 'Difícil') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            setStatus('GAMEOVER');
            triggerVibration('heavy');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, difficulty, triggerVibration]);

  return (
    <div className="min-h-screen flex flex-col items-center overflow-hidden relative text-white select-none">
      <ParticleBackground />

      <div className="z-10 w-full max-w-md h-screen flex flex-col p-6 gap-4 justify-between items-center relative">
        <div className="w-full mt-2">
          {status === 'PLAYING' ? (
            <TopPanel 
              score={score} 
              difficulty={difficulty} 
              moves={difficulty === 'Fácil' ? moves : timeLeft} 
            />
          ) : (
            <div className="h-16" />
          )}
        </div>

        <div className="w-full flex-1 flex items-center justify-center">
          {status === 'MENU' && (
            <div className="flex flex-col gap-6 w-full items-center animate-fade-in">
              <h1 className="text-4xl font-bold text-cyan-400 tracking-tighter text-center neon-text-green">
                NEON NEBULA
              </h1>
              <p className="text-cyan-300/60 text-sm -mt-4 mb-4">MATCH-3 FUTURISTA</p>
              
              <button 
                onClick={() => startGame('Fácil')}
                className="glass neon-border w-full py-4 rounded-2xl font-bold hover:bg-cyan-500/10 transition-colors"
              >
                MODO RELAX (INFINITO)
              </button>
              <button 
                onClick={() => startGame('Difícil')}
                className="glass neon-border w-full py-4 rounded-2xl font-bold hover:bg-pink-500/10 border-pink-500/30 transition-colors shadow-[0_0_15px_rgba(236,72,153,0.2)]"
              >
                MODO ARCADE (TEMPO)
              </button>
            </div>
          )}

          {status === 'PLAYING' && (
            <div className="relative w-full flex justify-center">
              {activePowerUp && (
                <div className="absolute -top-10 left-0 right-0 text-center animate-pulse">
                  <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                    Selecione uma peça para usar o {activePowerUp === 'bomb' ? 'Bomba' : activePowerUp === 'lightning' ? 'Raio' : 'Martelo'}
                  </span>
                </div>
              )}
              <GameBoard 
                gameState={{ score, moves, timeLeft, difficulty, grid, status }} 
                onSelectPiece={handleSelectPiece}
                onSwipe={handleSwipe}
                selectedPos={selectedPos}
                isExploding={isExplodingEffect}
              />
            </div>
          )}

          {status === 'GAMEOVER' && (
            <div className="glass neon-border p-8 rounded-3xl flex flex-col items-center gap-4 w-full animate-bounce-in">
              <h2 className="text-3xl font-bold text-pink-500 neon-text-pink">FIM DE JOGO</h2>
              <div className="text-center">
                <p className="text-cyan-400 uppercase text-xs">Pontuação Final</p>
                <p className="text-5xl font-bold">{score}</p>
                <p className="text-xs text-cyan-300/50 mt-1">{moves} Movimentos Totais</p>
              </div>
              <button 
                onClick={() => setStatus('MENU')}
                className="mt-4 bg-cyan-500 text-white px-8 py-3 rounded-full font-bold shadow-lg"
              >
                VOLTAR AO MENU
              </button>
            </div>
          )}
        </div>

        <div className="w-full flex flex-col gap-6 pb-6 items-center">
          {status === 'PLAYING' && (
            <>
              <div className="flex gap-4 items-center justify-center">
                <PowerUpButton 
                  type="bomb" 
                  count={inventory.bomb} 
                  isActive={activePowerUp === 'bomb'}
                  onClick={() => togglePowerUp('bomb')}
                />
                <PowerUpButton 
                  type="lightning" 
                  count={inventory.lightning} 
                  isActive={activePowerUp === 'lightning'}
                  onClick={() => togglePowerUp('lightning')}
                />
                <PowerUpButton 
                  type="hammer" 
                  count={inventory.hammer} 
                  isActive={activePowerUp === 'hammer'}
                  onClick={() => togglePowerUp('hammer')}
                />
              </div>

              <div className="flex gap-3 w-full max-w-[280px]">
                <button 
                  onClick={toggleHaptic}
                  className={`
                    glass w-14 h-14 rounded-full flex items-center justify-center border-2 
                    transition-all duration-300 active:scale-90
                    ${hapticEnabled ? 'border-cyan-400/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'border-white/10 text-white/30'}
                  `}
                >
                  {hapticEnabled ? <Vibrate className="w-6 h-6" /> : <VibrateOff className="w-6 h-6" />}
                </button>

                <button 
                  onClick={() => setStatus('MENU')}
                  className={`
                    relative group flex-1 h-14 
                    glass rounded-full border-2 border-green-400/30 
                    transition-all duration-300 active:scale-95
                    flex items-center justify-center overflow-hidden
                    shadow-[0_0_20px_rgba(74,222,128,0.15)]
                    hover:border-green-400/60 hover:shadow-[0_0_30px_rgba(74,222,128,0.3)]
                  `}
                >
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                  <span className="relative z-10 text-xs font-semibold text-green-400 uppercase tracking-[0.15em] neon-text-green">
                    Menu Principal
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-900/20 to-transparent pointer-events-none" />
    </div>
  );
};

export default App;
