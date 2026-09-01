import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPublicProfile } from '../types/tcg';
import { Search, UserPlus, X, Check, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFriendRequestSent?: () => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  onClose,
  onFriendRequestSent,
}) => {
  const { token, currentUser } = useAuth();
  const [tcgIdInput, setTcgIdInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<UserPublicProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tcgIdInput.trim()) return;

    setIsSearching(true);
    setErrorMsg(null);
    setSearchResult(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/users/by-tcgid/${encodeURIComponent(tcgIdInput.trim())}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'User not found');
      }
      setSearchResult(data.profile);
    } catch (err: any) {
      setErrorMsg(err.message || 'No collector found with this TCG ID');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!searchResult || !token) return;
    setIsSending(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: searchResult.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send request');
      }
      setSuccessMsg('Friend request sent! Once accepted, both of you will receive each other’s Legendary Card.');
      onFriendRequestSent?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send friend request');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[50px] p-6 sm:p-8 shadow-2xl flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-[200px] bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-[200px] bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Friend by TCG ID</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Enter a collector's permanent unique code</p>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={tcgIdInput}
              onChange={(e) => setTcgIdInput(e.target.value.toUpperCase())}
              placeholder="e.g. TCG-CAL82491 or CAL82491"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-[200px] px-5 py-3 text-slate-900 dark:text-white font-mono text-sm uppercase placeholder:normal-case placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-400 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !tcgIdInput.trim()}
            className="px-6 py-3 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-sm transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSearching ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Search</span>
          </button>
        </form>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-[200px] bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 px-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="mt-4 p-3.5 rounded-[200px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 px-4">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Search Result Card */}
        {searchResult && (
          <div className="mt-5 p-5 rounded-[50px] bg-slate-50 dark:bg-slate-950/70 border border-amber-400/40 space-y-3 shadow-lg">
            <div className="flex items-center gap-3">
              <img
                src={searchResult.avatarUrl}
                alt={searchResult.name}
                className="w-14 h-14 rounded-[200px] object-cover border-2 border-amber-400 bg-slate-200 dark:bg-slate-800"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base truncate">{searchResult.name}</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">({searchResult.age}y)</span>
                </div>
                <p className="text-xs font-mono text-amber-700 dark:text-amber-300 font-bold">{searchResult.tcgId}</p>
                {searchResult.locationArea && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{searchResult.locationArea}</p>
                )}
              </div>
            </div>

            {searchResult.bio && (
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic px-1">
                "{searchResult.bio}"
              </p>
            )}

            {/* Hobbies */}
            {searchResult.hobbies && searchResult.hobbies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {searchResult.hobbies.map((h, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-[200px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] border border-slate-200 dark:border-slate-700"
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}

            {/* Action button */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {searchResult.id === currentUser?.id ? (
                <span className="text-xs text-slate-500 dark:text-slate-400 italic">This is your own profile!</span>
              ) : searchResult.isFriend ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Already Friends</span>
              ) : searchResult.hasPendingRequest ? (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Request Pending</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendRequest}
                  disabled={isSending || !!successMsg}
                  className="w-full py-3 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Send Friend Request</span>
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
