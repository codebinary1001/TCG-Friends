import React from 'react';
import { TCGCard } from '../types/tcg';
import { Card3D } from './Card3D';
import { Sparkles, MessageCircle, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CardRevealModalProps {
  card: TCGCard | null;
  onClose: () => void;
  onStartChat?: (friendId: string) => void;
}

export const CardRevealModal: React.FC<CardRevealModalProps> = ({
  card,
  onClose,
  onStartChat,
}) => {
  if (!card) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative max-w-md w-full bg-slate-900 border-2 border-amber-400 rounded-[50px] p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.5)] text-center flex flex-col items-center my-auto text-white"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-[200px] bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-500/30 mb-3 animate-bounce">
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Legendary Card Unlocked!</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-1">
            New Friendship Forged!
          </h2>
          <p className="text-sm text-slate-300 mb-5 max-w-xs">
            You became mutual friends with <strong className="text-amber-300">{card.cardData.name}</strong>. Their unique Legendary Card is now in your collection!
          </p>

          {/* 3D Card Display */}
          <div className="my-2 transform hover:scale-105 transition-transform duration-300">
            <Card3D cardData={card.cardData} size="md" />
          </div>

          {/* Stat Boost info */}
          <div className="mt-4 w-full p-3.5 rounded-[200px] bg-amber-500/10 border border-amber-500/30 flex items-center justify-around text-xs px-6">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>+1 Collection Point</span>
            </div>
            <div className="text-slate-400">|</div>
            <div className="text-amber-200 font-medium">
              Rank Boosted 🚀
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-[200px] bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors border border-slate-700 cursor-pointer"
            >
              Keep Collecting
            </button>
            {onStartChat && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartChat(card.originalUserId);
                }}
                className="flex-1 py-3.5 px-4 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Message Friend</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
