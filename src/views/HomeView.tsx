import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { Card3D } from '../components/Card3D';
import { TCGCard, DailyMatchRecommendation, UserPublicProfile } from '../types/tcg';
import { Sparkles, Compass, Users, Layers, Trophy, Flame, Copy, Check, ArrowRight, UserPlus, MessageCircle, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeViewProps {
  onNavigate: (tab: string, extra?: any) => void;
  onOpenAddFriend: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenAddFriend }) => {
  const { currentUser, token } = useAuth();
  const { setUnlockedCard } = useRealtime();

  const [cards, setCards] = useState<TCGCard[]>([]);
  const [dailyMatches, setDailyMatches] = useState<DailyMatchRecommendation[]>([]);
  const [friendsList, setFriendsList] = useState<{ friendship: any; friend: UserPublicProfile }[]>([]);
  const [leaderboardStats, setLeaderboardStats] = useState<{ rank: number; totalCards: number; weeklyGain: number }>({
    rank: 1,
    totalCards: 0,
    weeklyGain: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [cardsRes, dailyRes, friendsRes, lbRes] = await Promise.all([
          fetch('/api/cards/collection', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/discover/daily', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/friends/list', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/leaderboard?period=global', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (cardsRes.ok) {
          const data = await cardsRes.json();
          setCards(data.cards || []);
          setLeaderboardStats((prev) => ({
            ...prev,
            totalCards: data.totalCards || 0,
            globalRank: data.globalRank || 1,
            weeklyGain: data.weeklyGain || 0,
          }));
        }

        if (dailyRes.ok) {
          const data = await dailyRes.json();
          setDailyMatches(data.recommendations || []);
        }

        if (friendsRes.ok) {
          const data = await friendsRes.json();
          setFriendsList(data.friends || []);
        }

        if (lbRes.ok) {
          const data = await lbRes.json();
          if (data.currentUserRank) {
            setLeaderboardStats({
              rank: data.currentUserRank.rank,
              totalCards: data.currentUserRank.cardCount,
              weeklyGain: data.currentUserRank.weeklyGain || 0,
            });
          }
        }
      } catch (e) {
        console.error('Failed to load home data', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const copyTCGId = () => {
    if (currentUser) {
      navigator.clipboard.writeText(currentUser.tcgId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSendQuickRequest = async (targetUserId: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        setDailyMatches((prev) =>
          prev.map((m) =>
            m.user.id === targetUserId ? { ...m, user: { ...m.user, hasPendingRequest: true } } : m
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-[200px] animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Loading your TCG Deck & Recommendations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative p-6 sm:p-8 rounded-[50px] bg-gradient-to-r from-amber-50 via-white to-yellow-50/60 dark:from-slate-900 dark:via-slate-900/90 dark:to-amber-950/40 border border-amber-300/70 dark:border-amber-500/30 overflow-hidden shadow-xl dark:shadow-2xl transition-colors duration-200">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-400/15 dark:bg-amber-500/10 rounded-[200px] blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[200px] bg-amber-500/15 border border-amber-400/40 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-semibold text-xs uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Collector Deck Active</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, <span className="text-amber-500 dark:text-amber-400">{currentUser?.name}</span>!
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Every friendship is a unique Legendary Card. Connect with people, forge mutual bonds, and expand your deck!
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={copyTCGId}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[200px] bg-white/80 dark:bg-black/50 hover:bg-slate-100 dark:hover:bg-black/70 border border-amber-400/60 dark:border-amber-500/50 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold transition-all shadow-sm"
              >
                <span>TCG ID: {currentUser?.tcgId}</span>
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
              </button>

              <button
                onClick={onOpenAddFriend}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Search by TCG ID</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto shrink-0 bg-white/90 dark:bg-slate-950/70 p-4 sm:p-5 rounded-[200px] border border-slate-200 dark:border-slate-800 backdrop-blur-sm px-6 shadow-sm">
            <div className="text-center px-4">
              <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">
                <Layers className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Cards</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {leaderboardStats.totalCards}
              </span>
            </div>

            <div className="text-center px-3 border-x border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" />
                <span>Rank</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-300">
                #{leaderboardStats.rank}
              </span>
            </div>

            <div className="text-center px-3">
              <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">
                <Flame className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" />
                <span>This Week</span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                +{leaderboardStats.weeklyGain}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S 3 AI MATCHES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Today's 3 AI Recommendations
            </h2>
          </div>
          <button
            onClick={() => onNavigate('discover')}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {dailyMatches.length === 0 ? (
          <div className="p-6 rounded-[50px] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
            <Compass className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">You are an early pioneer!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Share your permanent TCG ID (<strong className="text-amber-600 dark:text-amber-300">{currentUser?.tcgId}</strong>) with friends or invite people to start matching.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dailyMatches.map((match, idx) => (
              <div
                key={idx}
                className="p-5 rounded-[50px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-md dark:shadow-lg group"
              >
                <div className="space-y-3">
                  {/* Top user row */}
                  <div className="flex items-center gap-3">
                    <img
                      src={match.user.avatarUrl}
                      alt={match.user.name}
                      className="w-12 h-12 rounded-[200px] object-cover border border-amber-400/50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{match.user.name}</h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">({match.user.age}y)</span>
                      </div>
                      <p className="text-[11px] font-mono text-amber-600 dark:text-amber-300 font-bold">{match.user.tcgId}</p>
                    </div>
                  </div>

                  {/* AI Reason box */}
                  <div className="p-3.5 rounded-[50px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs px-4">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Why You Might Get Along</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-3">
                      "{match.whyYouMightGetAlong}"
                    </p>
                  </div>

                  {/* Shared hobbies pills */}
                  {match.sharedInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {match.sharedInterests.map((sh, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-[200px] bg-slate-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 text-[10px] font-medium border border-slate-200 dark:border-slate-700"
                        >
                          ✓ {sh}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('discover')}
                    className="flex-1 py-2 px-3 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold transition-colors"
                  >
                    Profile
                  </button>
                  {match.user.isFriend ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold px-3 py-2">✓ Friends</span>
                  ) : match.user.hasPendingRequest ? (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold px-3 py-2">Pending</span>
                  ) : (
                    <button
                      onClick={() => handleSendQuickRequest(match.user.id)}
                      className="flex-1 py-2 px-3 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-xs transition-all shadow-sm"
                    >
                      + Add Friend
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RECENTLY COLLECTED CARDS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Recently Collected Legendary Cards
            </h2>
          </div>
          <button
            onClick={() => onNavigate('collection')}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            <span>View Full Deck ({cards.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="p-8 rounded-[50px] bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-[200px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Your Deck is Empty</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              Send friend requests or add friends by TCG ID. Whenever a friendship is mutually accepted, both of you collect each other's Legendary Card!
            </p>
            <button
              onClick={() => onNavigate('discover')}
              className="px-5 py-2.5 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
            >
              Discover People Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.slice(0, 3).map((card) => (
              <div key={card.id} className="flex justify-center">
                <Card3D cardData={card.cardData} size="md" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ACTIVE FRIENDSHIP STREAKS */}
      {friendsList.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400 fill-orange-400" />
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Active Friendship Streaks
              </h2>
            </div>
            <button
              onClick={() => onNavigate('friends')}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              <span>Chat with Friends</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {friendsList.map(({ friendship, friend }) => (
              <div
                key={friendship.id}
                onClick={() => onNavigate('friends', { selectedFriendId: friend.id })}
                className="p-3.5 rounded-[50px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-400 dark:hover:border-orange-500/40 transition-all cursor-pointer flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={friend.avatarUrl}
                    alt={friend.name}
                    className="w-10 h-10 rounded-[200px] object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">{friend.name}</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{friend.tcgId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2.5 py-1 rounded-[200px] bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 font-bold text-xs">
                  <Flame className="w-3.5 h-3.5 fill-orange-400" />
                  <span>{friendship.streakDays || 1}d</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
