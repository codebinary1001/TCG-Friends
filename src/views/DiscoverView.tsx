import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DailyMatchRecommendation, UserPublicProfile } from '../types/tcg';
import { Card3D } from '../components/Card3D';
import { ReportModal } from '../components/ReportModal';
import { BlockModal } from '../components/BlockModal';
import { Compass, Sparkles, UserPlus, MessageCircle, X, MapPin, Calendar, Flag, UserX, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DiscoverViewProps {
  onNavigateToChat: (friendId: string) => void;
  onOpenAddFriend: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  onNavigateToChat,
  onOpenAddFriend,
}) => {
  const { token } = useAuth();

  const [recommendations, setRecommendations] = useState<DailyMatchRecommendation[]>([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [inspectUser, setInspectUser] = useState<UserPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestSentIds, setRequestSentIds] = useState<string[]>([]);

  // Safety modals
  const [reportTarget, setReportTarget] = useState<UserPublicProfile | null>(null);
  const [blockTarget, setBlockTarget] = useState<UserPublicProfile | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/discover/daily', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.recommendations || []);
        }
      } catch (e) {
        console.error('Failed to fetch recommendations', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [token]);

  const handleSendFriendRequest = async (targetUserId: string) => {
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
        setRequestSentIds((prev) => [...prev, targetUserId]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSkip = (userId: string) => {
    setSkippedIds((prev) => [...prev, userId]);
  };

  const visibleRecommendations = recommendations.filter(
    (r) => !skippedIds.includes(r.user.id)
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[200px] bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-amber-300 dark:border-amber-500/30">
            <Compass className="w-3.5 h-3.5" />
            <span>Daily AI Matchmaking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Today's Friendship Recommendations
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Every day, our AI analyzes genuine profiles and recommends 3 real people you might click with.
          </p>
        </div>

        <button
          onClick={onOpenAddFriend}
          className="self-start sm:self-auto px-5 py-3 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
        >
          <UserPlus className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Add by TCG ID</span>
        </button>
      </div>

      {isLoading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-amber-500 dark:border-amber-400 border-t-transparent rounded-[200px] animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Generating AI-powered friendship recommendations...</p>
        </div>
      ) : visibleRecommendations.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-[50px] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-lg mx-auto shadow-md">
          <div className="w-16 h-16 rounded-[200px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Compass className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">No New Recommendations Today</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {recommendations.length === 0
              ? "You're one of the first TCG Friends users! Invite friends using your permanent TCG ID to grow the community."
              : "You've reviewed today's 3 AI recommendations! Check back tomorrow for 3 brand new picks."}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenAddFriend}
              className="w-full sm:w-auto px-6 py-3 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-md"
            >
              Add Friend by TCG ID
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {visibleRecommendations.map((rec) => {
            const hasSent = requestSentIds.includes(rec.user.id) || rec.user.hasPendingRequest;
            const isFriend = rec.user.isFriend;

            return (
              <motion.div
                key={rec.user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[50px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all overflow-hidden flex flex-col justify-between shadow-md dark:shadow-xl"
              >
                {/* Header portrait banner */}
                <div className="p-6 pb-0 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={rec.user.avatarUrl}
                          alt={rec.user.name}
                          className="w-16 h-16 rounded-[200px] object-cover border-2 border-amber-400 shadow-md bg-slate-100 dark:bg-slate-800"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-[200px] border-2 border-white dark:border-slate-900 ${
                            rec.user.onlineStatus === 'online'
                              ? 'bg-emerald-500'
                              : rec.user.onlineStatus === 'recently_active'
                              ? 'bg-amber-400'
                              : 'bg-slate-400 dark:bg-slate-600'
                          }`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 dark:text-white text-base truncate">
                            {rec.user.name}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {rec.user.age}y
                          </span>
                        </div>
                        <p className="text-xs font-mono text-amber-600 dark:text-amber-300 font-bold">{rec.user.tcgId}</p>
                        {rec.user.locationArea && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate">{rec.user.locationArea}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-3 py-1 rounded-[200px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-black">
                      {rec.compatibilityScore}% Match
                    </div>
                  </div>

                  {/* AI "Why You Might Get Along" */}
                  <div className="p-4 rounded-[30px] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Why You Might Get Along</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                      "{rec.whyYouMightGetAlong}"
                    </p>
                  </div>

                  {/* Bio */}
                  {rec.user.bio && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2">
                      "{rec.user.bio}"
                    </p>
                  )}

                  {/* Hobbies & Interests Tags */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                      Interests & Hobbies
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {rec.user.hobbies && rec.user.hobbies.length > 0 ? (
                        rec.user.hobbies.map((h, i) => {
                          const isShared = rec.sharedInterests.some((s) => s.toLowerCase() === h.toLowerCase());
                          return (
                            <span
                              key={i}
                              className={`px-3 py-1 rounded-[200px] text-[11px] font-medium border ${
                                isShared
                                  ? 'bg-amber-100 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-400/40 font-bold'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {isShared && '✨ '}
                              {h}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">None listed yet</span>
                      )}
                    </div>
                  </div>

                  {/* Availability Preview */}
                  {rec.user.availability && rec.user.availability.length > 0 && (
                    <div className="p-3.5 rounded-[30px] bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <Calendar className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                        <span>Usual Availability</span>
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300">
                        {rec.user.availability.map((a) => `${a.day} (${a.timeRange})`).join(', ')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 mt-4">
                  {/* Primary actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setInspectUser(rec.user)}
                      className="py-3 px-3 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>View Profile</span>
                    </button>

                    {isFriend ? (
                      <button
                        onClick={() => onNavigateToChat(rec.user.id)}
                        className="py-3 px-3 rounded-[200px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat</span>
                      </button>
                    ) : hasSent ? (
                      <div className="py-3 px-3 rounded-[200px] bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs text-center border border-amber-300 dark:border-amber-500/30">
                        Request Pending
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSendFriendRequest(rec.user.id)}
                        className="py-3 px-3 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Add Friend</span>
                      </button>
                    )}
                  </div>

                  {/* Secondary safety & skip row */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setReportTarget(rec.user)}
                        className="px-2.5 py-1 rounded-[200px] bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center gap-1 font-bold cursor-pointer text-[11px]"
                        title="Report inappropriate profile"
                      >
                        <Flag className="w-3 h-3" />
                        <span>Report</span>
                      </button>
                      <button
                        onClick={() => setBlockTarget(rec.user)}
                        className="px-2.5 py-1 rounded-[200px] bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/30 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 font-bold cursor-pointer text-[11px]"
                        title="Block this user"
                      >
                        <UserX className="w-3 h-3" />
                        <span>Block</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleSkip(rec.user.id)}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors px-3 py-1 rounded-[200px] cursor-pointer text-xs font-semibold"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Profile Inspect Modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[50px] p-6 sm:p-8 shadow-2xl flex flex-col items-center"
          >
            <button
              onClick={() => setInspectUser(null)}
              className="absolute top-5 right-5 p-2 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xs uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 mb-4">
              Card Preview Lore
            </h3>

            <Card3D
              cardData={{
                name: inspectUser.name,
                age: inspectUser.age,
                tcgId: inspectUser.tcgId,
                avatarUrl: inspectUser.avatarUrl,
                bio: inspectUser.bio,
                hobbies: inspectUser.hobbies,
                interests: inspectUser.interests,
                favoriteActivities: inspectUser.favoriteActivities,
                locationArea: inspectUser.locationArea,
                cardTheme: inspectUser.cardTheme,
                customCardColor: inspectUser.customCardColor,
                customQuote: inspectUser.customQuote,
                friendshipDate: new Date().toISOString(),
                streakDays: 1,
                milestones: ['first_encounter'],
              }}
              size="md"
            />

            <div className="w-full mt-5 space-y-2">
              <button
                onClick={() => {
                  handleSendFriendRequest(inspectUser.id);
                  setInspectUser(null);
                }}
                className="w-full py-3.5 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Send Friend Request & Collect Card
              </button>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectUser;
                    setInspectUser(null);
                    setReportTarget(target);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 px-3 py-1 rounded-full cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectUser;
                    setInspectUser(null);
                    setBlockTarget(target);
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-semibold flex items-center gap-1 px-3 py-1 rounded-full cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Block</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          reportedUser={reportTarget}
          onClose={() => setReportTarget(null)}
          onReportSuccess={() => {
            setSkippedIds((prev) => [...prev, reportTarget.id]);
          }}
        />
      )}

      {/* Block Modal */}
      {blockTarget && (
        <BlockModal
          targetUser={blockTarget}
          onClose={() => setBlockTarget(null)}
          onBlockSuccess={() => {
            setSkippedIds((prev) => [...prev, blockTarget.id]);
          }}
        />
      )}
    </div>
  );
};
