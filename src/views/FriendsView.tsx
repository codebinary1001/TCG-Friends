import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { UserPublicProfile, Friendship, FriendRequest, Message } from '../types/tcg';
import { Card3D } from '../components/Card3D';
import { FriendshipTriviaModal } from '../components/FriendshipTriviaModal';
import { MinigamesModal } from '../components/MinigamesModal';
import { ReportModal } from '../components/ReportModal';
import { BlockModal } from '../components/BlockModal';
import {
  Users,
  Search,
  MessageCircle,
  Flame,
  Send,
  Sparkles,
  UserCheck,
  UserX,
  Layers,
  ChevronLeft,
  X,
  Gamepad2,
  Shield,
  Flag,
  Trophy,
  Zap,
  Info,
  ArrowLeftRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FriendsViewProps {
  initialFriendId?: string;
  onOpenAddFriend: () => void;
  onNavigateToCollection: () => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  initialFriendId,
  onOpenAddFriend,
  onNavigateToCollection,
}) => {
  const { token, currentUser } = useAuth();
  const { setOnMessageReceived, onlineUserIds, setUnlockedCard } = useRealtime();

  const [tab, setTab] = useState<'friends' | 'requests'>('friends');
  const [friendsList, setFriendsList] = useState<{ friendship: Friendship; friend: UserPublicProfile }[]>([]);
  const [requests, setRequests] = useState<{ incoming: FriendRequest[]; outgoing: FriendRequest[] }>({
    incoming: [],
    outgoing: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(initialFriendId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inspectCardFriend, setInspectCardFriend] = useState<UserPublicProfile | null>(null);
  const [isTriviaOpen, setIsTriviaOpen] = useState(false);
  const [isMinigamesOpen, setIsMinigamesOpen] = useState(false);

  // Safety controls
  const [showSafetyMenu, setShowSafetyMenu] = useState(false);
  const [reportTarget, setReportTarget] = useState<UserPublicProfile | null>(null);
  const [blockTarget, setBlockTarget] = useState<UserPublicProfile | null>(null);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch Friends and Requests
  const fetchData = async () => {
    if (!token) return;
    try {
      const [fRes, rRes] = await Promise.all([
        fetch('/api/friends/list', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/friends/requests', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (fRes.ok) {
        const data = await fRes.json();
        const friends: { friendship: Friendship; friend: UserPublicProfile }[] = data.friends || [];
        setFriendsList(friends);

        if (!selectedFriendId && friends.length > 0 && !initialFriendId) {
          setSelectedFriendId(friends[0].friend.id);
        } else if (selectedFriendId && !friends.some((f) => f.friend.id === selectedFriendId)) {
          // If the selected friend was blocked or removed
          setSelectedFriendId(friends.length > 0 ? friends[0].friend.id : null);
        }
      }

      if (rRes.ok) {
        const data = await rRes.json();
        setRequests(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Fetch messages when selected friend changes
  useEffect(() => {
    if (!token || !selectedFriendId) {
      setMessages([]);
      return;
    }

    setShowSafetyMenu(false);

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages/${selectedFriendId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchMessages();
  }, [token, selectedFriendId]);

  // Real-time message receiver hook
  useEffect(() => {
    setOnMessageReceived((newMsg: Message) => {
      if (
        (newMsg.senderId === selectedFriendId && newMsg.receiverId === currentUser?.id) ||
        (newMsg.senderId === currentUser?.id && newMsg.receiverId === selectedFriendId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      // Also refresh friends list to update streak/last interaction
      fetchData();
    });

    return () => setOnMessageReceived(null);
  }, [selectedFriendId, currentUser]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token || !selectedFriendId || !inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedFriendId,
          content: textToSend,
          type: 'text',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Friend Request Actions
  const handleRespondRequest = async (requestId: string, action: 'accept' | 'decline') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/friends/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        if (action === 'accept' && data.newCard) {
          setUnlockedCard(data.newCard);
        }
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePlayExchangeAnimation = (friend: UserPublicProfile) => {
    setUnlockedCard({
      id: 'exchange_' + friend.id,
      ownerId: currentUser?.id || '',
      originalUserId: friend.id,
      friendshipId: selectedFriendship?.id || '',
      collectedAt: selectedFriendship?.createdAt || new Date().toISOString(),
      cardData: {
        name: friend.name,
        age: friend.age,
        tcgId: friend.tcgId,
        avatarUrl: friend.avatarUrl,
        bio: friend.bio,
        hobbies: friend.hobbies,
        interests: friend.interests,
        favoriteActivities: friend.favoriteActivities,
        locationArea: friend.locationArea,
        cardTheme: friend.cardTheme,
        customCardColor: friend.customCardColor,
        customQuote: friend.customQuote,
        equippedFrame: friend.equippedFrame,
        friendshipDate: selectedFriendship?.createdAt || new Date().toISOString(),
        streakDays: selectedFriendship?.streakDays || 1,
        milestones: selectedFriendship?.milestones || ['friendship_started', 'card_collected'],
      },
    });
  };

  const selectedFriend = friendsList.find((f) => f.friend.id === selectedFriendId)?.friend;
  const selectedFriendship = friendsList.find((f) => f.friend.id === selectedFriendId)?.friendship;

  // Check if both users are online
  const isSelectedFriendOnline = Boolean(
    selectedFriend && (onlineUserIds.has(selectedFriend.id) || selectedFriend.onlineStatus === 'online')
  );

  const filteredFriends = friendsList.filter(
    (f) =>
      f.friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.friend.tcgId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.friend.hobbies || []).some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-140px)] min-h-[600px] flex flex-col rounded-[50px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg dark:shadow-2xl">
      <div className="flex-1 flex overflow-hidden">
        {/* ================= LEFT SIDEBAR (Friends List / Requests) ================= */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950 flex flex-col ${
            selectedFriendId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Tabs */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
            <button
              onClick={() => setTab('friends')}
              className={`flex-1 py-2.5 px-3 rounded-[200px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'friends'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-200/60 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Friends ({friendsList.length})</span>
            </button>

            <button
              onClick={() => setTab('requests')}
              className={`flex-1 py-2.5 px-3 rounded-[200px] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                tab === 'requests'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-200/60 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Requests</span>
              {requests.incoming.length > 0 && (
                <span className="px-2 py-0.5 rounded-[200px] bg-rose-500 text-white text-[10px] font-black">
                  {requests.incoming.length}
                </span>
              )}
            </button>
          </div>

          {/* Search bar */}
          {tab === 'friends' && (
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800/80">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, hobby, TCG ID..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[200px] pl-9 pr-4 py-2.5 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {tab === 'friends' ? (
              filteredFriends.length === 0 ? (
                <div className="p-6 text-center text-slate-500 dark:text-slate-400 space-y-3 my-auto">
                  <Users className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">No friends found</p>
                  <button
                    onClick={onOpenAddFriend}
                    className="px-4 py-2.5 rounded-[200px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm cursor-pointer"
                  >
                    + Add by TCG ID
                  </button>
                </div>
              ) : (
                filteredFriends.map(({ friendship, friend }) => {
                  const isSelected = selectedFriendId === friend.id;
                  const isOnline = onlineUserIds.has(friend.id) || friend.onlineStatus === 'online';

                  return (
                    <div
                      key={friend.id}
                      onClick={() => setSelectedFriendId(friend.id)}
                      className={`p-3 rounded-[200px] transition-all cursor-pointer flex items-center justify-between gap-3 px-4 ${
                        isSelected
                          ? 'bg-amber-400/20 dark:bg-amber-400/10 border border-amber-400/60 dark:border-amber-400/40 text-slate-900 dark:text-white font-semibold'
                          : 'hover:bg-slate-200/60 dark:hover:bg-slate-900/80 text-slate-700 dark:text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <img
                            src={friend.avatarUrl}
                            alt={friend.name}
                            className="w-11 h-11 rounded-[200px] object-cover border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-[200px] border-2 border-white dark:border-slate-950 ${
                              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'
                            }`}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{friend.name}</h4>
                            {isOnline && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-bold">{friend.tcgId}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isOnline && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black tracking-wide">
                            ONLINE
                          </span>
                        )}
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-[200px] bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/25 text-orange-700 dark:text-orange-400 text-[10px] font-bold">
                          <Flame className="w-3 h-3 fill-orange-400" />
                          <span>{friendship.streakDays || 1}d</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* Requests Tab */
              <div className="space-y-4 p-2">
                <div>
                  <h4 className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2">
                    Incoming Requests ({requests.incoming.length})
                  </h4>
                  {requests.incoming.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">No incoming friend requests.</p>
                  ) : (
                    requests.incoming.map((req) => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-[30px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 mb-2 shadow-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={req.senderProfile?.avatarUrl}
                            alt={req.senderProfile?.name}
                            className="w-10 h-10 rounded-[200px] object-cover border border-amber-400/60"
                          />
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{req.senderProfile?.name}</h5>
                            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300">{req.senderProfile?.tcgId}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleRespondRequest(req.id, 'accept')}
                            className="flex-1 py-2 rounded-[200px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handleRespondRequest(req.id, 'decline')}
                            className="py-2 px-3.5 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs transition-colors cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Outgoing Requests ({requests.outgoing.length})
                  </h4>
                  {requests.outgoing.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic">No pending outgoing requests.</p>
                  ) : (
                    requests.outgoing.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-[200px] bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between mb-1.5 px-4 shadow-sm"
                      >
                        <span className="text-xs text-slate-900 dark:text-white font-medium truncate">{req.receiverProfile?.name}</span>
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Pending...</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT CHAT PANE ================= */}
        <div
          className={`flex-1 flex flex-col bg-slate-100/40 dark:bg-slate-950 ${
            !selectedFriendId ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {!selectedFriend ? (
            <div className="text-center p-8 text-slate-500 dark:text-slate-400 space-y-3">
              <MessageCircle className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Select a friend to start chatting</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                Maintain friendship streaks through messages, live multiplayer minigames, and cards!
              </p>
            </div>
          ) : (
            <>
              {/* Chat Top Header */}
              <div className="p-3.5 sm:p-4 bg-white/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedFriendId(null)}
                    className="md:hidden p-2 rounded-[200px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    <img
                      src={selectedFriend.avatarUrl}
                      alt={selectedFriend.name}
                      className="w-10 h-10 rounded-[200px] object-cover border border-amber-400/60"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-[200px] border-2 border-white dark:border-slate-900 ${
                        isSelectedFriendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{selectedFriend.name}</h3>
                      {isSelectedFriendOnline ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          Online Now
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Offline</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{selectedFriend.tcgId}</span>
                      <span className="text-slate-400 dark:text-slate-500">•</span>
                      <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
                        <Flame className="w-3 h-3 fill-orange-400" />
                        <span>{selectedFriendship?.streakDays || 1}-Day Streak</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Header Action Tools */}
                <div className="flex items-center gap-1.5">
                  {/* Minigames Button - Online state highlights actively */}
                  {isSelectedFriendOnline ? (
                    <button
                      onClick={() => setIsMinigamesOpen(true)}
                      className="p-2.5 rounded-[200px] bg-gradient-to-r from-emerald-500 via-amber-400 to-yellow-400 hover:brightness-105 text-slate-950 font-black border border-amber-300 transition-all flex items-center gap-1.5 text-xs px-3.5 cursor-pointer shadow-md shadow-amber-500/20"
                      title="Both online! Play live multiplayer minigames"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>Play Minigame</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-800 animate-ping shrink-0" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSafetyNotice('Minigames unlock when both friends are online simultaneously! Invite your friend online to play.');
                        setTimeout(() => setSafetyNotice(null), 4000);
                      }}
                      className="p-2.5 rounded-[200px] bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 transition-colors flex items-center gap-1.5 text-xs px-3 cursor-pointer"
                      title="Minigames require both players to be online"
                    >
                      <Gamepad2 className="w-4 h-4 text-slate-400" />
                      <span className="hidden sm:inline">Minigames (Offline)</span>
                      <span className="sm:hidden">Games</span>
                    </button>
                  )}

                  <button
                    onClick={() => setIsTriviaOpen(true)}
                    className="p-2.5 rounded-[200px] bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 transition-colors flex items-center gap-1 text-xs font-semibold px-3 cursor-pointer"
                    title="Play Friendship Trivia"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Trivia</span>
                  </button>

                  <button
                    onClick={() => setInspectCardFriend(selectedFriend)}
                    className="p-2.5 rounded-[200px] bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 transition-colors flex items-center gap-1 text-xs font-semibold px-3 cursor-pointer"
                    title="View Legendary Friend Card"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Card</span>
                  </button>

                  <button
                    onClick={() => handlePlayExchangeAnimation(selectedFriend)}
                    className="p-2.5 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold transition-all flex items-center gap-1 text-xs px-3 shadow-sm cursor-pointer"
                    title="Watch the special Card Exchange animation with this friend"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="hidden sm:inline">Exchange</span>
                  </button>

                  {/* Prominent Safety & Moderation Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSafetyMenu(!showSafetyMenu)}
                      className="p-2.5 rounded-[200px] bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 transition-colors flex items-center gap-1 text-xs font-bold px-3 cursor-pointer"
                      title="Safety: Report or Block this user"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Safety</span>
                    </button>

                    <AnimatePresence>
                      {showSafetyMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 5 }}
                          className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-40 space-y-1"
                        >
                          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Safety Controls
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setShowSafetyMenu(false);
                              setReportTarget(selectedFriend);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Flag className="w-3.5 h-3.5" />
                            <span>Report User</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowSafetyMenu(false);
                              setBlockTarget(selectedFriend);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Block User</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Both Online Alert Banner */}
              {isSelectedFriendOnline && (
                <div className="px-4 py-2 bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-yellow-500/15 border-b border-amber-400/30 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-amber-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Both users online! Live minigames are unlocked.</span>
                  </div>
                  <button
                    onClick={() => setIsMinigamesOpen(true)}
                    className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 fill-slate-950" />
                    <span>Launch Game</span>
                  </button>
                </div>
              )}

              {/* Safety Toast Notice */}
              {safetyNotice && (
                <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/40 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300 font-medium">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>{safetyNotice}</span>
                  </div>
                  <button
                    onClick={() => setSafetyNotice(null)}
                    className="p-1 hover:bg-blue-200 dark:hover:bg-blue-900 rounded-full cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Chat Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400 dark:text-slate-500">
                    <Sparkles className="w-8 h-8 text-amber-500/60 dark:text-amber-400/60 animate-pulse" />
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Say hello to {selectedFriend.name} and reinforce your friendship streak!
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id;

                    if (msg.type === 'activity_prompt') {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <div className="px-5 py-2.5 rounded-[200px] bg-purple-100 dark:bg-purple-500/15 border border-purple-200 dark:border-purple-500/30 text-purple-900 dark:text-purple-200 text-xs font-medium text-center shadow-xs">
                            {msg.content}
                          </div>
                        </div>
                      );
                    }

                    if (msg.type === 'minigame_challenge') {
                      return (
                        <div key={msg.id} className="flex justify-center my-3">
                          <div className="max-w-md w-full p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-orange-500/20 border border-amber-400/60 dark:border-amber-400/40 text-slate-900 dark:text-white space-y-2.5 shadow-md">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                                  <Gamepad2 className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-black text-xs">Live Minigame Challenge!</h4>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    {isMe ? 'You challenged ' + selectedFriend.name : selectedFriend.name + ' challenged you!'}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-bold">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{msg.content}</p>

                            <div className="flex items-center gap-2 pt-1">
                              {isSelectedFriendOnline ? (
                                <button
                                  onClick={() => setIsMinigamesOpen(true)}
                                  className="w-full py-2 px-4 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                                >
                                  <Zap className="w-3.5 h-3.5 fill-slate-950" />
                                  <span>Open Arena & Play</span>
                                </button>
                              ) : (
                                <div className="w-full py-2 px-3 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold text-center">
                                  Opponent is currently offline
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (msg.type === 'minigame_result') {
                      return (
                        <div key={msg.id} className="flex justify-center my-3">
                          <div className="max-w-md w-full p-4 rounded-3xl bg-gradient-to-r from-purple-500/20 via-indigo-500/15 to-blue-500/20 border border-purple-400/50 text-slate-900 dark:text-white space-y-2 shadow-md">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                                <Trophy className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-black text-xs">Minigame Duel Completed</h4>
                                <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">
                                  +Friendship Streak Boosted!
                                </span>
                              </div>
                            </div>
                            <p className="text-xs font-semibold">{msg.content}</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-md p-3.5 rounded-[24px] text-xs sm:text-sm ${
                            isMe
                              ? 'bg-amber-400 text-slate-950 font-medium rounded-br-none shadow-md'
                              : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>

                        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMe && msg.readAt && ' • Read'}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar (Clean single text input) */}
              <div className="p-3 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800/80">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  {isSelectedFriendOnline && (
                    <button
                      type="button"
                      onClick={() => setIsMinigamesOpen(true)}
                      className="p-3 rounded-[200px] bg-amber-400/90 hover:bg-amber-300 text-slate-950 transition-all flex items-center gap-1.5 text-xs font-black shadow-sm cursor-pointer shrink-0"
                      title="Play live minigame duel"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Play Game</span>
                    </button>
                  )}

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Message ${selectedFriend.name}...`}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] px-5 py-3 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />

                  <button
                    type="submit"
                    disabled={isSending || !inputText.trim()}
                    className="p-3 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TCG Minigames Modal (Card Clash, Holo Memory, Speed Word Chain) */}
      <MinigamesModal
        isOpen={isMinigamesOpen}
        onClose={() => setIsMinigamesOpen(false)}
        friend={selectedFriend}
        onGameCompleted={() => {
          fetchData();
        }}
      />

      {/* Friendship Trivia / Activity Modal */}
      {selectedFriend && (
        <FriendshipTriviaModal
          friend={selectedFriend}
          isOpen={isTriviaOpen}
          onClose={() => setIsTriviaOpen(false)}
          onActivityCompleted={() => {
            fetchData();
          }}
        />
      )}

      {/* Inspect Friend's Legendary Card Modal */}
      {inspectCardFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[50px] p-6 sm:p-8 shadow-2xl flex flex-col items-center"
          >
            <button
              onClick={() => setInspectCardFriend(null)}
              className="absolute top-5 right-5 p-2 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xs uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 mb-4">
              Friend's Legendary Card
            </h3>

            <Card3D
              cardData={{
                name: inspectCardFriend.name,
                age: inspectCardFriend.age,
                tcgId: inspectCardFriend.tcgId,
                avatarUrl: inspectCardFriend.avatarUrl,
                bio: inspectCardFriend.bio,
                hobbies: inspectCardFriend.hobbies,
                interests: inspectCardFriend.interests,
                favoriteActivities: inspectCardFriend.favoriteActivities,
                locationArea: inspectCardFriend.locationArea,
                cardTheme: inspectCardFriend.cardTheme,
                customQuote: inspectCardFriend.customQuote,
                friendshipDate: selectedFriendship?.createdAt || new Date().toISOString(),
                streakDays: selectedFriendship?.streakDays || 1,
                milestones: selectedFriendship?.milestones || ['friendship_started'],
              }}
              size="md"
            />

            <div className="w-full mt-4 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const target = inspectCardFriend;
                  setInspectCardFriend(null);
                  handlePlayExchangeAnimation(target);
                }}
                className="w-full py-2.5 px-4 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
                <span>Replay Card Exchange Animation</span>
              </button>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectCardFriend;
                    setInspectCardFriend(null);
                    setReportTarget(target);
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = inspectCardFriend;
                    setInspectCardFriend(null);
                    setBlockTarget(target);
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Block</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Safety Report Modal */}
      {reportTarget && (
        <ReportModal
          reportedUser={reportTarget}
          onClose={() => setReportTarget(null)}
          onReportSuccess={(wasBlocked) => {
            if (wasBlocked) {
              fetchData();
              if (selectedFriendId === reportTarget.id) {
                setSelectedFriendId(null);
              }
            }
          }}
        />
      )}

      {/* Safety Block Modal */}
      {blockTarget && (
        <BlockModal
          targetUser={blockTarget}
          onClose={() => setBlockTarget(null)}
          onBlockSuccess={() => {
            fetchData();
            if (selectedFriendId === blockTarget.id) {
              setSelectedFriendId(null);
            }
          }}
        />
      )}
    </div>
  );
};
