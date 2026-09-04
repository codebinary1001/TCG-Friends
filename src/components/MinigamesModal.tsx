import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPublicProfile } from '../types/tcg';
import {
  Gamepad2,
  X,
  Swords,
  Sparkles,
  Layers,
  BrainCircuit,
  RotateCcw,
  Flame,
  Check,
  ChevronRight,
  Shield,
  Zap,
  Star,
  Award,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MinigamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend?: UserPublicProfile | null;
  onGameCompleted?: (gameName: string, score: number) => void;
}

type GameType = 'menu' | 'card_clash' | 'memory_flip' | 'synergy_trivia' | 'word_chain';

// --- Web Audio Synthesized Sound FX ---
const playTone = (freq: number, type: OscillatorType = 'sine', duration = 0.15) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio Context not permitted or muted
  }
};

const playFanfare = () => {
  [440, 554.37, 659.25, 880].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 'triangle', 0.25), i * 120);
  });
};

export const MinigamesModal: React.FC<MinigamesModalProps> = ({
  isOpen,
  onClose,
  friend,
  onGameCompleted,
}) => {
  const { token, currentUser } = useAuth();
  const [activeGame, setActiveGame] = useState<GameType>('menu');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // -------------------------------------------------------------
  // GAME 1: CARD CLASH (RPG Turn-Based Duel)
  // -------------------------------------------------------------
  const [playerHp, setPlayerHp] = useState(100);
  const [opponentHp, setOpponentHp] = useState(100);
  const [playerSp, setPlayerSp] = useState(30);
  const [clashTurn, setClashTurn] = useState<'player' | 'opponent'>('player');
  const [clashLogs, setClashLogs] = useState<string[]>([]);
  const [clashWinner, setClashWinner] = useState<'player' | 'opponent' | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);

  const opponentName = friend?.name || 'Grandmaster Deck AI';
  const opponentAvatar =
    friend?.avatarUrl ||
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80';
  const opponentTheme = friend?.cardTheme || 'inferno_red';

  const resetCardClash = () => {
    setPlayerHp(100);
    setOpponentHp(100);
    setPlayerSp(30);
    setClashTurn('player');
    setClashLogs([`⚔️ Battle commenced between ${currentUser?.name || 'You'} and ${opponentName}!`]);
    setClashWinner(null);
  };

  const handlePlayerMove = (moveType: 'strike' | 'shield' | 'overdrive') => {
    if (clashTurn !== 'player' || clashWinner || isAttacking) return;
    setIsAttacking(true);

    if (soundEnabled) playTone(520, 'square', 0.12);

    let damage = 0;
    let logMsg = '';

    if (moveType === 'strike') {
      damage = Math.floor(Math.random() * 12) + 16; // 16-27 dmg
      logMsg = `⚡ You used Synergy Strike for ${damage} damage!`;
      setPlayerSp((prev) => Math.min(100, prev + 25));
    } else if (moveType === 'shield') {
      const heal = Math.floor(Math.random() * 10) + 12;
      setPlayerHp((prev) => Math.min(100, prev + heal));
      setPlayerSp((prev) => Math.min(100, prev + 35));
      logMsg = `🛡️ You activated Camaraderie Barrier! Restored ${heal} HP & boosted SP.`;
    } else if (moveType === 'overdrive') {
      if (playerSp < 60) {
        setIsAttacking(false);
        return;
      }
      damage = Math.floor(Math.random() * 15) + 38; // 38-52 dmg
      logMsg = `✨ HOLO OVERDRIVE! Unleashed massive burst for ${damage} damage!`;
      setPlayerSp((prev) => Math.max(0, prev - 60));
    }

    const newOppHp = Math.max(0, opponentHp - damage);
    setOpponentHp(newOppHp);
    setClashLogs((prev) => [logMsg, ...prev.slice(0, 5)]);

    if (newOppHp <= 0) {
      setClashWinner('player');
      setIsAttacking(false);
      if (soundEnabled) playFanfare();
      recordVictory('TCG Card Clash Duel', 100);
      return;
    }

    // Opponent's counter turn
    setClashTurn('opponent');
    setTimeout(() => {
      if (newOppHp > 0) {
        const oppDmg = Math.floor(Math.random() * 14) + 14;
        const newPlHp = Math.max(0, playerHp - oppDmg);
        setPlayerHp(newPlHp);
        setClashLogs((prev) => [
          `🔥 ${opponentName} countered with Elemental Pulse for ${oppDmg} damage!`,
          ...prev.slice(0, 5),
        ]);
        if (soundEnabled) playTone(330, 'sawtooth', 0.15);

        if (newPlHp <= 0) {
          setClashWinner('opponent');
        } else {
          setClashTurn('player');
        }
      }
      setIsAttacking(false);
    }, 900);
  };

  // -------------------------------------------------------------
  // GAME 2: MEMORY FLIP (TCG Holo Match)
  // -------------------------------------------------------------
  interface MemoryCard {
    id: number;
    icon: string;
    label: string;
    isFlipped: boolean;
    isMatched: boolean;
  }

  const MEMORY_ICONS = [
    { icon: '🎮', label: 'Gaming' },
    { icon: '☕', label: 'Coffee' },
    { icon: '🎨', label: 'Pixel Art' },
    { icon: '🧗', label: 'Outdoors' },
    { icon: '🌌', label: 'Cosmic' },
    { icon: '🎧', label: 'Music' },
  ];

  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryMatches, setMemoryMatches] = useState(0);
  const [memoryTimer, setMemoryTimer] = useState(0);
  const [isMemoryFinished, setIsMemoryFinished] = useState(false);
  const memoryTimerRef = useRef<any>(null);

  const initMemoryGame = () => {
    const deck = [...MEMORY_ICONS, ...MEMORY_ICONS]
      .sort(() => Math.random() - 0.5)
      .map((item, index) => ({
        id: index,
        icon: item.icon,
        label: item.label,
        isFlipped: false,
        isMatched: false,
      }));
    setMemoryCards(deck);
    setFlippedCards([]);
    setMemoryMoves(0);
    setMemoryMatches(0);
    setMemoryTimer(0);
    setIsMemoryFinished(false);

    if (memoryTimerRef.current) clearInterval(memoryTimerRef.current);
    memoryTimerRef.current = setInterval(() => {
      setMemoryTimer((prev) => prev + 1);
    }, 1000);
  };

  const handleCardFlip = (index: number) => {
    if (flippedCards.length === 2 || memoryCards[index].isFlipped || memoryCards[index].isMatched) return;

    if (soundEnabled) playTone(440, 'sine', 0.08);

    const updated = memoryCards.map((c, i) => (i === index ? { ...c, isFlipped: true } : c));
    const newFlipped = [...flippedCards, index];
    setMemoryCards(updated);
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMemoryMoves((prev) => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;
      if (updated[firstIdx].icon === updated[secondIdx].icon) {
        // Match found!
        if (soundEnabled) playTone(660, 'triangle', 0.2);
        setTimeout(() => {
          setMemoryCards((prev) =>
            prev.map((c, i) => (i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c))
          );
          setFlippedCards([]);
          setMemoryMatches((m) => {
            const nextMatches = m + 1;
            if (nextMatches === MEMORY_ICONS.length) {
              if (memoryTimerRef.current) clearInterval(memoryTimerRef.current);
              setIsMemoryFinished(true);
              if (soundEnabled) playFanfare();
              recordVictory('Holo Memory Flip', 90);
            }
            return nextMatches;
          });
        }, 400);
      } else {
        // No match -> flip back
        setTimeout(() => {
          setMemoryCards((prev) =>
            prev.map((c, i) => (i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c))
          );
          setFlippedCards([]);
        }, 900);
      }
    }
  };

  // -------------------------------------------------------------
  // GAME 3: SPEED WORD CHAIN (Lexicon Challenge)
  // -------------------------------------------------------------
  const CATEGORIES = [
    { name: 'Video Games & Tech', startsWith: 'P', placeholder: 'e.g. Pokemon, Pixel, Platformer' },
    { name: 'Cozy Cafes & Food', startsWith: 'C', placeholder: 'e.g. Cappuccino, Croissant, Chai' },
    { name: 'Adventures & Hobbies', startsWith: 'B', placeholder: 'e.g. Bouldering, Backpacking, Boardgames' },
    { name: 'Sci-Fi & Space', startsWith: 'S', placeholder: 'e.g. Starlight, Supernova, Starship' },
  ];

  const [currentWordCategory, setCurrentWordCategory] = useState(0);
  const [wordInput, setWordInput] = useState('');
  const [wordList, setWordList] = useState<string[]>([]);
  const [wordScore, setWordScore] = useState(0);
  const [wordTimer, setWordTimer] = useState(30);
  const [isWordGameActive, setIsWordGameActive] = useState(false);
  const [isWordFinished, setIsWordFinished] = useState(false);
  const wordIntervalRef = useRef<any>(null);

  const startWordGame = () => {
    setCurrentWordCategory(Math.floor(Math.random() * CATEGORIES.length));
    setWordList([]);
    setWordScore(0);
    setWordTimer(30);
    setWordInput('');
    setIsWordGameActive(true);
    setIsWordFinished(false);

    if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
    wordIntervalRef.current = setInterval(() => {
      setWordTimer((prev) => {
        if (prev <= 1) {
          clearInterval(wordIntervalRef.current);
          setIsWordGameActive(false);
          setIsWordFinished(true);
          if (soundEnabled) playFanfare();
          recordVictory('Speed Word Chain', 85);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWord = wordInput.trim().toUpperCase();
    const requiredLetter = CATEGORIES[currentWordCategory].startsWith.toUpperCase();

    if (!cleanWord || cleanWord.length < 3) return;
    if (!cleanWord.startsWith(requiredLetter)) {
      if (soundEnabled) playTone(220, 'sawtooth', 0.15);
      return;
    }
    if (wordList.includes(cleanWord)) return;

    if (soundEnabled) playTone(580, 'sine', 0.1);
    const addedPoints = cleanWord.length * 10;
    setWordList((prev) => [cleanWord, ...prev]);
    setWordScore((prev) => prev + addedPoints);
    setWordInput('');
  };

  // -------------------------------------------------------------
  // Record Game Victory / Synergy Activity on Server
  // -------------------------------------------------------------
  const recordVictory = async (gameName: string, points: number) => {
    if (onGameCompleted) {
      onGameCompleted(gameName, points);
    }
    if (token && friend?.id) {
      try {
        await Promise.all([
          fetch('/api/friends/activity/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              friendId: friend.id,
              activityType: gameName,
              score: points,
            }),
          }),
          fetch('/api/minigames/finish', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              opponentId: friend.id,
              gameTitle: gameName,
              winnerId: currentUser?.id,
              score: points,
            }),
          }),
        ]);
      } catch (err) {
        console.error('Failed to record activity completion', err);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (memoryTimerRef.current) clearInterval(memoryTimerRef.current);
      if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[50px] p-5 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-[200px] bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  TCG Minigames Arena
                </h3>
                {friend && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-[200px] bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold border border-amber-400/40">
                    with {friend.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Play co-op activities to strengthen streaks & unlock Legendary cards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* GAME SELECTION MENU */}
        {/* ========================================================= */}
        {activeGame === 'menu' && (
          <div className="space-y-4">
            <div className="p-4 rounded-[30px] bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="w-6 h-6 text-amber-500 fill-amber-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Streak Booster Active</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Playing any minigame reinforces today's friendship interaction and earns +50 Collector XP!
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Game 1: Card Clash */}
              <div
                onClick={() => {
                  resetCardClash();
                  setActiveGame('card_clash');
                }}
                className="p-5 rounded-[40px] bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="w-11 h-11 rounded-[200px] bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Swords className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1 group-hover:text-amber-500 transition-colors">
                    TCG Card Clash
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    Turn-based tactical duel between collector cards with synergy strikes & shields!
                  </p>
                </div>
                <button className="w-full py-2.5 rounded-[200px] bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-1 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                  <span>Battle Now</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Game 2: Memory Flip */}
              <div
                onClick={() => {
                  initMemoryGame();
                  setActiveGame('memory_flip');
                }}
                className="p-5 rounded-[40px] bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="w-11 h-11 rounded-[200px] bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1 group-hover:text-amber-500 transition-colors">
                    Holo Memory Flip
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    Match pairs of collectible card badges and hobbies against the clock!
                  </p>
                </div>
                <button className="w-full py-2.5 rounded-[200px] bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-1 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                  <span>Play Flip</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Game 3: Speed Word Chain */}
              <div
                onClick={() => {
                  startWordGame();
                  setActiveGame('word_chain');
                }}
                className="p-5 rounded-[40px] bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/80 dark:to-slate-900 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="w-11 h-11 rounded-[200px] bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1 group-hover:text-amber-500 transition-colors">
                    Speed Word Chain
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    Fast category word association blitz. Test your shared hobbies lexicon!
                  </p>
                </div>
                <button className="w-full py-2.5 rounded-[200px] bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-1 group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                  <span>Start Blitz</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GAME 1: CARD CLASH SCREEN */}
        {/* ========================================================= */}
        {activeGame === 'card_clash' && (
          <div className="space-y-5">
            {/* Top Back button */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveGame('menu')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                ← Back to Minigames
              </button>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                <span>Round in Progress</span>
              </div>
            </div>

            {/* Duel Arena Visualizer */}
            <div className="grid grid-cols-2 gap-4 p-5 rounded-[40px] bg-slate-950 text-white relative overflow-hidden border border-slate-800 shadow-inner">
              <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />

              {/* Player Side */}
              <div className="flex flex-col items-center text-center space-y-2 z-10">
                <div className="relative">
                  <img
                    src={currentUser?.avatarUrl}
                    alt="Player"
                    className="w-16 h-16 rounded-[200px] object-cover border-2 border-amber-400 shadow-lg"
                  />
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-[200px] bg-amber-400 text-slate-950 font-black text-[9px]">
                    YOU
                  </span>
                </div>
                <h5 className="font-bold text-xs text-slate-200">{currentUser?.name}</h5>

                {/* HP Bar */}
                <div className="w-full max-w-[140px] space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-emerald-400">HP</span>
                    <span>{playerHp}/100</span>
                  </div>
                  <div className="w-full h-2 rounded-[200px] bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${playerHp}%` }}
                    />
                  </div>
                </div>

                {/* SP Meter */}
                <div className="w-full max-w-[140px] space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-cyan-400">SP Overdrive</span>
                    <span>{playerSp}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-[200px] bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-all duration-300"
                      style={{ width: `${playerSp}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Opponent Side */}
              <div className="flex flex-col items-center text-center space-y-2 z-10">
                <div className="relative">
                  <img
                    src={opponentAvatar}
                    alt="Opponent"
                    className="w-16 h-16 rounded-[200px] object-cover border-2 border-rose-400 shadow-lg"
                  />
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-[200px] bg-rose-500 text-white font-black text-[9px]">
                    RIVAL
                  </span>
                </div>
                <h5 className="font-bold text-xs text-slate-200">{opponentName}</h5>

                {/* Opponent HP Bar */}
                <div className="w-full max-w-[140px] space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-rose-400">HP</span>
                    <span>{opponentHp}/100</span>
                  </div>
                  <div className="w-full h-2 rounded-[200px] bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-red-400 transition-all duration-300"
                      style={{ width: `${opponentHp}%` }}
                    />
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-400 pt-2">
                  Theme: <span className="capitalize text-amber-300">{opponentTheme.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Combat Log */}
            <div className="p-3.5 rounded-[30px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1 max-h-24 overflow-y-auto">
              {clashLogs.map((log, i) => (
                <div key={i} className="text-slate-700 dark:text-slate-300 text-[11px]">
                  {log}
                </div>
              ))}
            </div>

            {/* Victory / Defeat Overlay or Action Controls */}
            {clashWinner ? (
              <div className="p-5 rounded-[40px] bg-gradient-to-r from-amber-500/20 to-yellow-400/20 border border-amber-400 text-center space-y-3">
                <div className="w-12 h-12 rounded-[200px] bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  {clashWinner === 'player' ? '🏆 Victory! +100 Friendship XP' : '💪 Good Duel! +50 Activity XP'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Your friendship streak is reinforced and activity milestone recorded!
                </p>
                <div className="flex gap-2 justify-center pt-1">
                  <button
                    onClick={resetCardClash}
                    className="px-5 py-2.5 rounded-[200px] bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => setActiveGame('menu')}
                    className="px-5 py-2.5 rounded-[200px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
                  >
                    Back to Menu
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => handlePlayerMove('strike')}
                  disabled={clashTurn !== 'player' || isAttacking}
                  className="p-3.5 rounded-[200px] bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex flex-col items-center gap-1 disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Synergy Strike</span>
                  <span className="text-[9px] text-slate-400">16-27 DMG</span>
                </button>

                <button
                  onClick={() => handlePlayerMove('shield')}
                  disabled={clashTurn !== 'player' || isAttacking}
                  className="p-3.5 rounded-[200px] bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex flex-col items-center gap-1 disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  <Shield className="w-4 h-4 text-teal-400" />
                  <span>Bond Shield</span>
                  <span className="text-[9px] text-slate-400">Heal + SP</span>
                </button>

                <button
                  onClick={() => handlePlayerMove('overdrive')}
                  disabled={clashTurn !== 'player' || playerSp < 60 || isAttacking}
                  className="p-3.5 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs transition-all flex flex-col items-center gap-1 disabled:opacity-40 cursor-pointer shadow-lg shadow-amber-500/25"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Holo Overdrive</span>
                  <span className="text-[9px] text-slate-900 font-mono">Req 60 SP (38-52 DMG)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* GAME 2: MEMORY FLIP SCREEN */}
        {/* ========================================================= */}
        {activeGame === 'memory_flip' && (
          <div className="space-y-5">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveGame('menu')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                ← Back to Minigames
              </button>

              <div className="flex items-center gap-4 text-xs font-mono font-bold">
                <span className="text-slate-600 dark:text-slate-400">Time: {memoryTimer}s</span>
                <span className="text-amber-600 dark:text-amber-400">Moves: {memoryMoves}</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  Matches: {memoryMatches}/{MEMORY_ICONS.length}
                </span>
              </div>
            </div>

            {/* Memory Card Grid (4 x 3) */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3 p-4 rounded-[40px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {memoryCards.map((card, idx) => (
                <div
                  key={card.id}
                  onClick={() => handleCardFlip(idx)}
                  className={`h-20 sm:h-24 rounded-[28px] transition-all duration-300 flex flex-col items-center justify-center p-2 cursor-pointer select-none text-center ${
                    card.isMatched
                      ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-300 scale-95'
                      : card.isFlipped
                      ? 'bg-white dark:bg-slate-800 border-2 border-amber-400 shadow-md rotate-y-180'
                      : 'bg-slate-200 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 hover:border-amber-400'
                  }`}
                >
                  {card.isFlipped || card.isMatched ? (
                    <div className="animate-in fade-in zoom-in duration-200 flex flex-col items-center">
                      <span className="text-2xl sm:text-3xl mb-1">{card.icon}</span>
                      <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">
                        {card.label}
                      </span>
                    </div>
                  ) : (
                    <div className="text-slate-400 dark:text-slate-600">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Win Modal Banner */}
            {isMemoryFinished && (
              <div className="p-5 rounded-[40px] bg-gradient-to-r from-emerald-500/20 to-teal-400/20 border border-emerald-500 text-center space-y-3">
                <div className="w-12 h-12 rounded-[200px] bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  🎉 Fantastic Memory! Completed in {memoryTimer}s ({memoryMoves} moves)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  +90 Friendship XP & Streak Reinforced!
                </p>
                <div className="flex gap-2 justify-center pt-1">
                  <button
                    onClick={initMemoryGame}
                    className="px-5 py-2.5 rounded-[200px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => setActiveGame('menu')}
                    className="px-5 py-2.5 rounded-[200px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
                  >
                    Back to Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* GAME 3: SPEED WORD CHAIN SCREEN */}
        {/* ========================================================= */}
        {activeGame === 'word_chain' && (
          <div className="space-y-5">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveGame('menu')}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                ← Back to Minigames
              </button>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-[200px] bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 font-mono font-bold text-xs">
                  ⏱️ {wordTimer}s Remaining
                </span>
                <span className="px-3 py-1 rounded-[200px] bg-amber-500/15 text-amber-800 dark:text-amber-300 font-mono font-bold text-xs">
                  Score: {wordScore}
                </span>
              </div>
            </div>

            {/* Category Banner */}
            <div className="p-5 rounded-[40px] bg-slate-900 text-white text-center space-y-2 border border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                Category Challenge
              </span>
              <h4 className="text-xl font-black">{CATEGORIES[currentWordCategory].name}</h4>
              <p className="text-xs text-slate-300">
                Enter words that start with the letter{' '}
                <strong className="text-amber-400 text-base font-black px-2 py-0.5 rounded-[200px] bg-amber-400/20 border border-amber-400/40">
                  {CATEGORIES[currentWordCategory].startsWith}
                </strong>
              </p>
            </div>

            {/* Word Input */}
            {isWordGameActive && (
              <form onSubmit={handleWordSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  placeholder={CATEGORIES[currentWordCategory].placeholder}
                  autoFocus
                  className="flex-1 px-5 py-3 rounded-[200px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-cyan-400 font-medium"
                />
                <button
                  type="submit"
                  disabled={!wordInput.trim()}
                  className="px-6 py-3 rounded-[200px] bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs transition-colors disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  Submit
                </button>
              </form>
            )}

            {/* Word Chain History */}
            <div className="p-4 rounded-[30px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-500 mb-2">
                Words Logged ({wordList.length}):
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-12">
                {wordList.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No words entered yet...</span>
                ) : (
                  wordList.map((w, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-[200px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-800 dark:text-cyan-300 text-xs font-bold"
                    >
                      {w}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Finished State */}
            {isWordFinished && (
              <div className="p-5 rounded-[40px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500 text-center space-y-3">
                <div className="w-12 h-12 rounded-[200px] bg-cyan-500 text-white flex items-center justify-center mx-auto shadow-lg">
                  <Star className="w-6 h-6 fill-white" />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  ⚡ Blitz Complete! Final Score: {wordScore}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Great job! You logged {wordList.length} words and reinforced your friendship streak!
                </p>
                <div className="flex gap-2 justify-center pt-1">
                  <button
                    onClick={startWordGame}
                    className="px-5 py-2.5 rounded-[200px] bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs cursor-pointer shadow-sm"
                  >
                    Play Again
                  </button>
                  <button
                    onClick={() => setActiveGame('menu')}
                    className="px-5 py-2.5 rounded-[200px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs cursor-pointer"
                  >
                    Back to Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
