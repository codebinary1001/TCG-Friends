import React, { useState } from 'react';
import { Sparkles, X, Check, Flame, Trophy, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { UserPublicProfile } from '../types/tcg';
import { useAuth } from '../context/AuthContext';

interface FriendshipTriviaModalProps {
  friend: UserPublicProfile;
  isOpen: boolean;
  onClose: () => void;
  onActivityCompleted: () => void;
}

const TRIVIA_QUESTIONS = [
  {
    prompt: 'What activity would make for the most epic weekend hangout?',
    options: ['🎮 Multiplayer Gaming Tournament', '☕ Cozy Cafe & Deep Talk', '🏕️ Outdoor Roadtrip / Hiking', '🍕 Movie & Pizza Marathon'],
  },
  {
    prompt: 'What kind of music energizes you the most?',
    options: ['🎧 Synthwave / EDM', '🎸 Indie Rock & Alternative', '🎷 Lofi / Chill Beats', '🎤 Pop & Classic Hits'],
  },
  {
    prompt: 'If you could master any superpower immediately, which one would you pick?',
    options: ['✨ Teleportation across planets', '⏳ Time travel with pause', '🧠 Telepathy / Mind reading', '🦅 Effortless Flight'],
  },
];

export const FriendshipTriviaModal: React.FC<FriendshipTriviaModalProps> = ({
  friend,
  isOpen,
  onClose,
  onActivityCompleted,
}) => {
  const { token } = useAuth();
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const currentQ = TRIVIA_QUESTIONS[currentQIndex];

  const handleSelectOption = async (optionIdx: number) => {
    const updated = [...selectedAnswers, optionIdx];
    setSelectedAnswers(updated);

    if (currentQIndex < TRIVIA_QUESTIONS.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      // Record activity completion on backend
      if (token) {
        try {
          await fetch('/api/friends/activity/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              friendId: friend.id,
              activityType: 'Friendship Question Exchange',
              score: 3,
            }),
          });
          onActivityCompleted();
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[50px] p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-[200px] bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isCompleted ? (
          <>
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-[200px] bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-amber-300 dark:border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Friendship Pulse • Question {currentQIndex + 1} of {TRIVIA_QUESTIONS.length}</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Friendship Icebreaker with {friend.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Answer prompt questions to discover synergies and boost your friendship streak!
            </p>

            <div className="w-full p-5 rounded-[30px] bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 mb-6 shadow-inner">
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{currentQ.prompt}</p>
            </div>

            <div className="w-full space-y-2.5">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className="w-full p-4 rounded-[200px] bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-800 dark:text-white font-medium text-xs transition-all text-left border border-slate-200 dark:border-slate-700 flex items-center justify-between group px-5 shadow-xs cursor-pointer"
                >
                  <span>{opt}</span>
                  <span className="opacity-0 group-hover:opacity-100 text-slate-950 font-bold">
                    Pick →
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="py-4 space-y-4">
            <div className="w-16 h-16 rounded-[200px] bg-amber-500/20 border-2 border-amber-400 text-amber-500 dark:text-amber-300 flex items-center justify-center mx-auto animate-bounce">
              <Flame className="w-8 h-8 fill-amber-400" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white">Activity Completed!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs">
              You and <strong className="text-amber-600 dark:text-amber-300">{friend.name}</strong> just reinforced your friendship streak and completed an activity milestone!
            </p>

            <div className="p-3.5 rounded-[200px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-6">
              🔥 Streak Reinforced • Milestone Unlocked
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Back to Chat
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
