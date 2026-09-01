import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LeaderboardEntry } from '../types/tcg';
import { Trophy, Medal, Award, Flame, Sparkles, Crown, Shield, Layers, UserPlus, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface LeaderboardViewProps {
  onOpenAddFriend: () => void;
}

const MILESTONE_ACHIEVEMENTS = [
  { count: 10, title: 'Collector', color: 'text-blue-400', badge: '🛡️ Collector', desc: '10 Unique Legendary Cards' },
  { count: 25, title: 'Social Collector', color: 'text-emerald-400', badge: '🌿 Social Collector', desc: '25 Unique Legendary Cards' },
  { count: 50, title: 'Master Collector', color: 'text-purple-400', badge: '🔮 Master Collector', desc: '50 Unique Legendary Cards' },
  { count: 100, title: 'Elite Collector', color: 'text-rose-400', badge: '🔥 Elite Collector', desc: '100 Unique Legendary Cards' },
  { count: 250, title: 'TCG Legend', color: 'text-amber-400', badge: '✨ TCG Legend', desc: '250 Unique Legendary Cards' },
  { count: 500, title: 'TCG Icon', color: 'text-yellow-300', badge: '👑 TCG Icon', desc: '500 Unique Legendary Cards' },
];

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onOpenAddFriend }) => {
  const { token, currentUser } = useAuth();
  const [period, setPeriod] = useState<'global' | 'monthly' | 'weekly'>('global');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries || []);
          setCurrentUserRank(data.currentUserRank || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [token, period]);

  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];

  const userCards = currentUser?.cardsCollectedCount || 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[200px] bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-yellow-300 dark:border-yellow-500/30">
            <Trophy className="w-3.5 h-3.5" />
            <span>Global Friendship Arena</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Collector Leaderboards
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Compete on the global rankings. 1 Friend = 1 Legendary Card = 1 Point.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center p-1.5 rounded-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start sm:self-auto shadow-xs">
          {(['global', 'monthly', 'weekly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2.5 rounded-[200px] text-xs font-bold capitalize transition-all cursor-pointer ${
                period === p
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p === 'global' ? 'All-Time Global' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium (If at least 1 entry exists) */}
      {!isLoading && entries.length > 0 && (
        <div className="pt-8 pb-4">
          <div className="flex items-end justify-center gap-2 sm:gap-6 max-w-2xl mx-auto">
            {/* Rank 2 (Silver) */}
            {top2 ? (
              <div className="flex-1 flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[200px] border-2 border-slate-300 overflow-hidden shadow-lg shadow-slate-400/20 bg-slate-100 dark:bg-slate-800">
                    <img src={top2.avatarUrl} alt={top2.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-[200px] bg-slate-200 dark:bg-slate-300 text-slate-900 font-black text-xs flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
                    2
                  </div>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[100px] text-center">
                  {top2.name}
                </h4>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{top2.tcgId}</span>
                <div className="mt-2 w-full p-4 rounded-[30px] bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{top2.cardCount}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Cards</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 opacity-0" />
            )}

            {/* Rank 1 (Gold - Center) */}
            {top1 && (
              <div className="flex-1 flex flex-col items-center -mt-6">
                <Crown className="w-8 h-8 text-amber-500 dark:text-yellow-400 animate-bounce mb-1" />
                <div className="relative mb-2">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[200px] border-3 border-amber-400 overflow-hidden shadow-xl shadow-amber-500/30 bg-slate-100 dark:bg-slate-800">
                    <img src={top1.avatarUrl} alt={top1.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-[200px] bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 font-black text-sm flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
                    1
                  </div>
                </div>
                <h4 className="font-black text-sm sm:text-base text-amber-700 dark:text-amber-300 truncate max-w-[120px] text-center">
                  {top1.name}
                </h4>
                <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold">{top1.tcgId}</span>
                <div className="mt-2 w-full p-4 rounded-[30px] bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/40 text-center shadow-lg shadow-amber-500/10">
                  <span className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-300">{top1.cardCount}</span>
                  <span className="text-[10px] text-amber-800 dark:text-amber-200/80 block font-bold uppercase tracking-wider">
                    Legendary Cards
                  </span>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {top3 ? (
              <div className="flex-1 flex flex-col items-center">
                <div className="relative mb-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[200px] border-2 border-amber-700 overflow-hidden shadow-lg shadow-amber-800/20 bg-slate-100 dark:bg-slate-800">
                    <img src={top3.avatarUrl} alt={top3.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-[200px] bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
                    3
                  </div>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[100px] text-center">
                  {top3.name}
                </h4>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{top3.tcgId}</span>
                <div className="mt-2 w-full p-4 rounded-[30px] bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">{top3.cardCount}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Cards</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 opacity-0" />
            )}
          </div>
        </div>
      )}

      {/* Your Current Rank Sticky Banner */}
      {currentUserRank && (
        <div className="p-5 sm:p-6 rounded-[50px] bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 dark:from-amber-500/20 dark:via-yellow-500/10 dark:to-amber-500/20 border-2 border-amber-400 dark:border-amber-400/80 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-[200px] bg-amber-400 text-slate-950 font-black text-base flex items-center justify-center shadow-md">
              #{currentUserRank.rank}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 dark:text-white text-sm">Your Current Standing</span>
                <span className="text-xs text-amber-700 dark:text-amber-300 font-mono font-bold">({currentUser?.tcgId})</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                You have collected <strong>{currentUserRank.cardCount}</strong> Legendary Cards.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAddFriend}
            className="px-5 py-2.5 rounded-[200px] bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Friend</span>
          </button>
        </div>
      )}

      {/* Rankings List Table */}
      <div className="rounded-[50px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg dark:shadow-xl">
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">Leaderboard Rankings</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{entries.length} Collectors Ranked</span>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-amber-500 dark:border-amber-400 border-t-transparent rounded-[200px] animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading standings...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <Trophy className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No collectors yet in this period</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {entries.map((entry) => {
              const isMe = entry.userId === currentUser?.id;

              return (
                <div
                  key={entry.userId}
                  className={`p-4 sm:p-5 flex items-center justify-between transition-colors ${
                    isMe ? 'bg-amber-500/15 dark:bg-amber-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-8 text-center font-black text-sm">
                      {entry.rank === 1 ? (
                        <span className="text-amber-500 text-base">🥇</span>
                      ) : entry.rank === 2 ? (
                        <span className="text-slate-400 text-base">🥈</span>
                      ) : entry.rank === 3 ? (
                        <span className="text-amber-700 text-base">🥉</span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">#{entry.rank}</span>
                      )}
                    </div>

                    <img
                      src={entry.avatarUrl}
                      alt={entry.name}
                      className="w-11 h-11 rounded-[200px] object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                          {entry.name}
                        </h4>
                        {isMe && (
                          <span className="px-2 py-0.5 rounded-[200px] bg-amber-400 text-slate-950 font-black text-[10px]">
                            YOU
                          </span>
                        )}
                        {entry.equippedTitle && (
                          <span className="hidden sm:inline px-2.5 py-0.5 rounded-[200px] bg-slate-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                            {entry.equippedTitle}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{entry.tcgId}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        {entry.cardCount} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">cards</span>
                      </div>
                      {entry.weeklyGain !== undefined && entry.weeklyGain > 0 && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                          +{entry.weeklyGain} this wk
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collector Achievements Progression */}
      <div className="p-6 sm:p-8 rounded-[50px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-lg dark:shadow-xl">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">Milestone Badges & Titles</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">Unlock titles as your collection expands</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MILESTONE_ACHIEVEMENTS.map((ach) => {
            const isUnlocked = userCards >= ach.count;
            return (
              <div
                key={ach.count}
                className={`p-4 rounded-[200px] border flex items-center justify-between px-5 ${
                  isUnlocked
                    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 text-slate-900 dark:text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <span className={ach.color}>{ach.badge}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{ach.desc}</p>
                </div>

                <div className="shrink-0">
                  {isUnlocked ? (
                    <div className="p-1 rounded-[200px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      {userCards}/{ach.count}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
