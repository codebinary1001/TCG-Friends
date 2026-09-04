import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { TCGCard, CardTheme } from '../types/tcg';
import { Card3D } from '../components/Card3D';
import { Layers, Search, Filter, Sparkles, Trophy, ArrowUpDown, Flame, UserPlus, ArrowLeftRight } from 'lucide-react';
import { motion } from 'motion/react';

interface CollectionViewProps {
  onOpenAddFriend: () => void;
  onNavigateToDiscover: () => void;
}

const THEME_FILTERS: { label: string; value: 'all' | CardTheme }[] = [
  { label: 'All Themes', value: 'all' },
  { label: '✨ Solar Gold', value: 'holographic_gold' },
  { label: '⚡ Cyber Matrix', value: 'neon_cyber' },
  { label: '🌌 Cosmic Nebula', value: 'cosmic_void' },
  { label: '🌿 Verdant Forest', value: 'emerald_nature' },
  { label: '🔥 Blazing Ember', value: 'inferno_red' },
  { label: '❄️ Polar Lights', value: 'aurora_borealis' },
  { label: '🔮 Arcane Crystal', value: 'amethyst_arcane' },
  { label: '🛡️ Obsidian Chrome', value: 'obsidian_chrome' },
  { label: '🎨 Custom Chroma', value: 'custom' },
];

export const CollectionView: React.FC<CollectionViewProps> = ({
  onOpenAddFriend,
  onNavigateToDiscover,
}) => {
  const { token, currentUser } = useAuth();
  const { setUnlockedCard } = useRealtime();
  const [cards, setCards] = useState<TCGCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<'all' | CardTheme>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'streak' | 'name'>('newest');
  const [stats, setStats] = useState({ totalCards: 0, globalRank: 1, weeklyGain: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchCollection = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/cards/collection', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCards(data.cards || []);
          setStats({
            totalCards: data.totalCards || 0,
            globalRank: data.globalRank || 1,
            weeklyGain: data.weeklyGain || 0,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollection();
  }, [token]);

  const filteredCards = cards
    .filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        c.cardData.name.toLowerCase().includes(q) ||
        c.cardData.tcgId.toLowerCase().includes(q) ||
        (c.cardData.locationArea || '').toLowerCase().includes(q) ||
        (c.cardData.hobbies || []).some((h) => h.toLowerCase().includes(q));

      const matchTheme = selectedTheme === 'all' || c.cardData.cardTheme === selectedTheme;
      return matchSearch && matchTheme;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.unlockedAt).getTime() - new Date(b.unlockedAt).getTime();
      }
      if (sortBy === 'streak') {
        return (b.cardData.streakDays || 0) - (a.cardData.streakDays || 0);
      }
      if (sortBy === 'name') {
        return a.cardData.name.localeCompare(b.cardData.name);
      }
      return 0;
    });

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Stats Banner */}
      <div className="p-6 sm:p-8 rounded-[50px] bg-gradient-to-r from-purple-50 via-white to-amber-50/70 dark:from-slate-900 dark:via-slate-900/90 dark:to-purple-950/40 border border-purple-200 dark:border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl dark:shadow-2xl transition-colors">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[200px] bg-purple-500/15 text-purple-800 dark:text-purple-300 text-xs font-semibold uppercase tracking-wider border border-purple-300 dark:border-purple-500/30">
            <Layers className="w-3.5 h-3.5" />
            <span>Legendary Binder</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Your Card Collection ({cards.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Every card represents a genuine mutual friend. Click any card to flip and explore lore!
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/90 dark:bg-slate-950/80 p-4 sm:p-5 rounded-[200px] border border-slate-200 dark:border-slate-800 backdrop-blur-sm self-stretch md:self-auto justify-around px-6 shadow-sm">
          <div className="text-center px-3">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Deck</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalCards}</div>
          </div>
          <div className="text-center px-3 border-x border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Global Rank</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-300">#{stats.globalRank}</div>
          </div>
          <div className="text-center px-3">
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Weekly Gain</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{stats.weeklyGain}</div>
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search collected cards by name, hobby, location, TCG ID..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[200px] pl-11 pr-4 py-3 text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-400 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[200px] px-4 py-3 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-amber-500 dark:text-amber-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer font-medium"
              >
                <option value="newest" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Newest Collected</option>
                <option value="oldest" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Oldest First</option>
                <option value="streak" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Highest Streak</option>
                <option value="name" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Theme Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {THEME_FILTERS.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setSelectedTheme(tf.value)}
              className={`px-4 py-2 rounded-[200px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTheme === tf.value
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-500 dark:border-amber-400 border-t-transparent rounded-[200px] animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading collection deck...</p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-[50px] bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-md mx-auto shadow-md">
          <div className="w-16 h-16 rounded-[200px] bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {cards.length === 0 ? 'Your Collection Deck is Empty' : 'No Cards Match Filters'}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {cards.length === 0
              ? 'Whenever you and another user mutually accept a friend request, both users unlock each other’s unique Legendary Card!'
              : 'Try clearing your search query or switching themes.'}
          </p>

          {cards.length === 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onNavigateToDiscover}
                className="w-full sm:w-auto px-6 py-3 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
              >
                Discover Daily Recommendations
              </button>
              <button
                onClick={onOpenAddFriend}
                className="w-full sm:w-auto px-6 py-3 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                Add by TCG ID
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {filteredCards.map((card) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <Card3D cardData={card.cardData} size="md" />
              <button
                type="button"
                onClick={() => setUnlockedCard(card)}
                className="px-4 py-2 rounded-[200px] bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-slate-700 dark:text-slate-200 hover:text-amber-800 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/40 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Watch the 3D card exchange animation for this card"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500 stroke-[2.5]" />
                <span>Replay Card Exchange</span>
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
