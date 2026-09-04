import React, { useState } from 'react';
import { User, Compass, MessageCircle, Sparkles, Trophy, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    icon: User,
    color: 'from-blue-500 to-cyan-500',
    title: '1. Profile',
    headline: 'Tell people about yourself.',
    description:
      'Customize your hobbies, interests, availability, and choose your favorite elemental Card Theme. You will also get a permanent, unique TCG ID to share with friends.',
    badge: 'Your Identity',
  },
  {
    icon: Compass,
    color: 'from-amber-500 to-orange-500',
    title: '2. Discover',
    headline: "Every day you'll get 3 AI-powered friendship recommendations.",
    description:
      'Our AI analyzes mutual hobbies, availability, and passions to find real compatible people, explaining exactly why you might get along.',
    badge: '3 Daily Picks',
  },
  {
    icon: MessageCircle,
    color: 'from-emerald-500 to-teal-500',
    title: '3. Connect',
    headline: 'Chat and play minigames before deciding whether to become friends.',
    description:
      'Send messages, play live multiplayer minigames when both are online, and explore activities together to see if you click.',
    badge: 'Real-Time Social',
  },
  {
    icon: Sparkles,
    color: 'from-purple-500 to-pink-500',
    title: '4. Cards',
    headline: 'Every friendship gives you a unique Legendary TCG Card.',
    description:
      'When both users accept a friend request, both receive each other’s unique Legendary Card. Every card is equally Legendary (1 friend = 1 card = 1 point)!',
    badge: 'Strictly Legendary',
  },
  {
    icon: Trophy,
    color: 'from-yellow-400 to-amber-500',
    title: '5. Leaderboard',
    headline: 'Collect cards and compete with people around the world.',
    description:
      'Grow your collection, build friendship streaks, and climb the Global, Monthly, and Weekly leaderboards while unlocking exclusive cosmetic frames and titles!',
    badge: 'Compete & Connect',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const { updateProfile } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isLast = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const handleFinish = async () => {
    try {
      await updateProfile({ hasCompletedTutorial: true });
    } catch (e) {
      console.error(e);
    }
    onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[50px] p-6 sm:p-8 shadow-2xl overflow-hidden"
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-between gap-1.5 mb-6">
          {TUTORIAL_STEPS.map((step, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-[200px] transition-all duration-300 ${
                idx === currentStepIndex
                  ? 'bg-amber-400'
                  : idx < currentStepIndex
                  ? 'bg-amber-400/50'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center text-center space-y-4"
          >
            {/* Step Icon Graphic */}
            <div
              className={`w-20 h-20 rounded-[200px] bg-gradient-to-tr ${currentStep.color} p-0.5 shadow-xl flex items-center justify-center text-white`}
            >
              <div className="w-full h-full rounded-[200px] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center">
                <StepIcon className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-[200px] bg-amber-500/15 border border-amber-300 dark:border-white/10 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <span>{currentStep.badge}</span>
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {currentStep.title}
            </h3>

            <p className="text-sm font-bold text-amber-700 dark:text-amber-200 leading-snug max-w-xs">
              "{currentStep.headline}"
            </p>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm">
              {currentStep.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Buttons */}
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2.5 rounded-[200px] text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Skip Tutorial
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3 px-5 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{isLast ? 'Get Started' : 'Continue'}</span>
            {isLast ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
