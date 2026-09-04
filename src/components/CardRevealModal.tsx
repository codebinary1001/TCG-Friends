import React, { useState, useEffect, useRef } from 'react';
import { TCGCard, CardSnapshot, UserPublicProfile } from '../types/tcg';
import { Card3D } from './Card3D';
import { useAuth } from '../context/AuthContext';
import { soundEffects } from '../utils/soundEffects';
import {
  Sparkles,
  MessageCircle,
  X,
  CheckCircle,
  ArrowLeftRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  RotateCw,
  Layers,
  Flame,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface CardRevealModalProps {
  card: TCGCard | null;
  myCard?: CardSnapshot | null;
  friendProfile?: UserPublicProfile | null;
  onClose: () => void;
  onStartChat?: (friendId: string) => void;
  initialPhase?: 'exchange' | 'acquired';
}

type AnimationPhase = 'standoff' | 'swooping' | 'acquired';

export const CardRevealModal: React.FC<CardRevealModalProps> = ({
  card,
  myCard,
  friendProfile,
  onClose,
  onStartChat,
  initialPhase = 'exchange',
}) => {
  const { currentUser } = useAuth();
  const [phase, setPhase] = useState<AnimationPhase>(
    initialPhase === 'acquired' ? 'acquired' : 'standoff'
  );
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMuted, setIsMuted] = useState(soundEffects.getMuted());
  const [showShockwave, setShowShockwave] = useState(false);
  const animationTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Construct a fallback CardSnapshot for current user if not passed
  const userCardSnapshot: CardSnapshot = myCard || {
    name: currentUser?.name || 'You',
    age: currentUser?.age || 18,
    tcgId: currentUser?.tcgId || 'YOU001',
    avatarUrl: currentUser?.avatarUrl || '',
    bio: currentUser?.bio || 'Passionate card collector & explorer.',
    hobbies: currentUser?.hobbies || ['Card Collecting'],
    interests: currentUser?.interests || ['Gaming', 'Anime'],
    favoriteActivities: currentUser?.favoriteActivities || ['Minigames', 'Trading'],
    locationArea: currentUser?.locationArea || 'Collector Realm',
    cardTheme: currentUser?.cardTheme || 'holographic_gold',
    customCardColor: currentUser?.customCardColor,
    customQuote: currentUser?.customQuote || 'Friendship is legendary!',
    equippedFrame: currentUser?.equippedFrame,
    friendshipDate: new Date().toISOString(),
    streakDays: 1,
    milestones: ['friendship_started', 'card_collected'],
  };

  const friendName = card?.cardData.name || friendProfile?.name || 'Friend';
  const friendAvatar = card?.cardData.avatarUrl || friendProfile?.avatarUrl;

  const clearTimers = () => {
    animationTimerRef.current.forEach((t) => clearTimeout(t));
    animationTimerRef.current = [];
  };

  const runExchangeSequence = () => {
    clearTimers();
    setPhase('standoff');
    setShowShockwave(false);
    setIsFlipped(false);

    // Initial audio chime
    soundEffects.playHolographicChimes();

    // 1. Standoff -> Swoop starts at 1000ms
    const t1 = setTimeout(() => {
      setPhase('swooping');
      soundEffects.playCardWhoosh();

      // 2. Midpoint shockwave and impact sound at 1800ms
      const t2 = setTimeout(() => {
        setShowShockwave(true);
        soundEffects.playImpactBoom();

        // Confetti burst on clash
        try {
          confetti({
            particleCount: 85,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#38bdf8', '#fbbf24'],
          });
        } catch {}

        // 3. Complete exchange & reveal acquired card at 2600ms
        const t3 = setTimeout(() => {
          setPhase('acquired');
          setShowShockwave(false);
          soundEffects.playFanfare();
          soundEffects.playHolographicChimes();

          // Second grand celebration shower
          try {
            confetti({
              particleCount: 110,
              spread: 100,
              origin: { y: 0.65 },
              colors: ['#f59e0b', '#ffd700', '#f43f5e', '#a855f7'],
            });
          } catch {}
        }, 800);
        animationTimerRef.current.push(t3);
      }, 750);
      animationTimerRef.current.push(t2);
    }, 1000);
    animationTimerRef.current.push(t1);
  };

  // Launch exchange on mount if card exists
  useEffect(() => {
    if (!card) return;
    if (initialPhase === 'acquired') {
      setPhase('acquired');
      soundEffects.playFanfare();
    } else {
      runExchangeSequence();
    }

    return () => {
      clearTimers();
    };
  }, [card]);

  const toggleSound = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
  };

  const handleSkipToAcquired = () => {
    clearTimers();
    setShowShockwave(false);
    setPhase('acquired');
    soundEffects.playFanfare();
  };

  if (!card) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-xl overflow-y-auto">
        {/* Full-screen Shockwave Flash */}
        {showShockwave && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.95, 0], scale: [0.8, 1.3, 1.8] }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="fixed inset-0 pointer-events-none z-50 bg-radial from-amber-300/80 via-yellow-400/40 to-transparent mix-blend-screen"
          />
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 25 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="relative max-w-2xl w-full bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-400/80 rounded-[44px] p-5 sm:p-8 shadow-[0_0_80px_rgba(245,158,11,0.45)] text-center flex flex-col items-center my-auto text-white overflow-hidden"
        >
          {/* Ambient Background Energy Orb */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Controls: Sound & Close */}
          <div className="absolute top-4 left-4 sm:top-5 sm:left-5 z-20 flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-amber-300 transition-colors border border-slate-700/60 cursor-pointer"
              title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
            </button>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* ========================================================================= */}
          {/* PHASE 1 & 2: THE CARD EXCHANGE IN MOTION (STANDOFF & SWOOPING)             */}
          {/* ========================================================================= */}
          {phase !== 'acquired' ? (
            <div className="w-full flex flex-col items-center">
              {/* Animated Header Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/30 mb-2 animate-pulse">
                <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
                <span>Card Exchange in Progress</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
                Mutual Card Exchange Ceremony
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mb-6 max-w-md">
                Forging legendary bond with <strong className="text-amber-300">{friendName}</strong>. Exchanging your signature cards across the collector ether!
              </p>

              {/* The Exchange Stage Arena */}
              <div className="relative w-full min-h-[380px] sm:min-h-[420px] flex items-center justify-center overflow-visible my-2">
                {/* Center Energy Conduit & Plasma Rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Outer Pulsing Vortex Ring */}
                  <motion.div
                    animate={{ rotate: 360, scale: [0.95, 1.08, 0.95] }}
                    transition={{ rotate: { duration: 12, repeat: Infinity, ease: 'linear' }, scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
                    className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-dashed border-amber-400/30 flex items-center justify-center"
                  >
                    <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-cyan-400/30 border-dotted" />
                  </motion.div>

                  {/* Center Electric Energy Orb */}
                  <div className="absolute w-20 h-20 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-300/30 to-cyan-500/20 blur-md animate-pulse" />

                  {/* Dual Animated Exchange Arrows */}
                  <div className="absolute z-10 w-12 h-12 rounded-full bg-slate-900/90 border-2 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.6)] flex items-center justify-center text-amber-300">
                    <motion.div
                      animate={{ rotate: [0, 180, 360] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
                    </motion.div>
                  </div>
                </div>

                {/* Left Card: YOUR CARD (Sent to Friend) */}
                <motion.div
                  className="absolute z-20"
                  initial={{ x: -140, y: 0, scale: 0.85, rotateZ: -6, opacity: 1 }}
                  animate={
                    phase === 'swooping'
                      ? {
                          x: [ -140, -40, 160, 240 ],
                          y: [ 0, -85, 30, 0 ],
                          scale: [ 0.85, 1.05, 0.6, 0.1 ],
                          rotateZ: [ -6, 12, 35, 45 ],
                          rotateY: [ 0, 90, 180, 270 ],
                          opacity: [ 1, 1, 0.7, 0 ],
                        }
                      : {
                          x: -130,
                          y: [0, -8, 0],
                          scale: 0.85,
                          rotateZ: -5,
                          opacity: 1,
                        }
                  }
                  transition={
                    phase === 'swooping'
                      ? { duration: 1.5, ease: 'easeInOut' }
                      : { y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }
                  }
                >
                  <div className="flex flex-col items-center">
                    <div className="mb-2 px-3 py-1 rounded-[200px] bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <User className="w-3 h-3" />
                      <span>Your Card (Sending)</span>
                    </div>
                    <div className="pointer-events-none drop-shadow-2xl">
                      <Card3D cardData={userCardSnapshot} size="sm" interactive={false} />
                    </div>
                  </div>
                </motion.div>

                {/* Right Card: FRIEND'S CARD (Incoming from Friend) */}
                <motion.div
                  className="absolute z-20"
                  initial={{ x: 140, y: 0, scale: 0.85, rotateZ: 6, opacity: 1 }}
                  animate={
                    phase === 'swooping'
                      ? {
                          x: [ 140, 50, -60, 0 ],
                          y: [ 0, 85, -20, 0 ],
                          scale: [ 0.85, 1.05, 1.15, 1.2 ],
                          rotateZ: [ 6, -14, 5, 0 ],
                          rotateY: [ 0, 180, 360, 0 ],
                          opacity: [ 1, 1, 1, 1 ],
                        }
                      : {
                          x: 130,
                          y: [0, 8, 0],
                          scale: 0.85,
                          rotateZ: 5,
                          opacity: 1,
                        }
                  }
                  transition={
                    phase === 'swooping'
                      ? { duration: 1.5, ease: 'easeInOut' }
                      : { y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }
                  }
                >
                  <div className="flex flex-col items-center">
                    <div className="mb-2 px-3 py-1 rounded-[200px] bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-3 h-3 fill-amber-300" />
                      <span>{friendName}'s Card (Incoming)</span>
                    </div>
                    <div className="pointer-events-none drop-shadow-2xl">
                      <Card3D cardData={card.cardData} size="sm" interactive={false} />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Progress and Skip Action */}
              <div className="w-full flex items-center justify-between pt-4 border-t border-slate-800/80 mt-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>
                    {phase === 'standoff'
                      ? 'Establishing quantum foil link...'
                      : 'Transmitting cards across the matrix...'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSkipToAcquired}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-[200px] bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Skip Animation
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* PHASE 3: THE ACQUIRED CARD GRAND REVEAL                                   */
            /* ========================================================================= */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col items-center"
            >
              {/* Grand Acquired Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[200px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/30 mb-2 animate-bounce">
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Legendary Card Acquired!</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
                Cards Mutually Exchanged!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mb-4 max-w-sm">
                You sent your card to <strong className="text-amber-300">{friendName}</strong> and received their unique Legendary Card into your Binder!
              </p>

              {/* 3D Interactive Card Showcase */}
              <div className="relative my-2 transform transition-transform duration-300">
                {/* Ambient Aura Ring */}
                <div className="absolute inset-0 -m-4 bg-gradient-to-tr from-amber-500/20 via-yellow-300/25 to-cyan-500/20 rounded-[40px] blur-xl pointer-events-none animate-pulse" />
                <Card3D cardData={card.cardData} size="md" isFlipped={isFlipped} onFlip={() => setIsFlipped(!isFlipped)} />
              </div>

              {/* Stat & Achievement Boost Pill */}
              <div className="mt-3 w-full p-3.5 rounded-[24px] bg-amber-500/10 border border-amber-500/30 grid grid-cols-3 divide-x divide-amber-500/20 text-xs px-2 sm:px-4">
                <div className="flex flex-col items-center gap-0.5 text-center px-1">
                  <div className="flex items-center gap-1 text-emerald-400 font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>+1 Card</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Added to Binder</span>
                </div>

                <div className="flex flex-col items-center gap-0.5 text-center px-1">
                  <div className="flex items-center gap-1 text-amber-300 font-bold">
                    <Zap className="w-3.5 h-3.5 fill-amber-300" />
                    <span>Rank Boost</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Leaderboard +</span>
                </div>

                <div className="flex flex-col items-center gap-0.5 text-center px-1">
                  <div className="flex items-center gap-1 text-orange-400 font-bold">
                    <Flame className="w-3.5 h-3.5 fill-orange-400" />
                    <span>Day 1 Streak</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Mutual Friendship</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full mt-4">
                {/* Replay Exchange Animation */}
                <button
                  type="button"
                  onClick={runExchangeSequence}
                  className="w-full sm:w-auto py-3 px-4 rounded-[200px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  title="Watch the exchange animation again"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay Exchange</span>
                </button>

                {/* Flip Card Toggle */}
                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="w-full sm:w-auto py-3 px-4 rounded-[200px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{isFlipped ? 'Show Front Foil' : 'Flip to Stats'}</span>
                </button>

                {/* Message Friend */}
                {onStartChat && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartChat(card.originalUserId);
                    }}
                    className="w-full sm:flex-1 py-3 px-4 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message {friendName.split(' ')[0]}</span>
                  </button>
                )}

                {/* Close / Keep Collecting */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto py-3 px-5 rounded-[200px] bg-slate-700/80 hover:bg-slate-600 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const CardExchangeModal = CardRevealModal;
