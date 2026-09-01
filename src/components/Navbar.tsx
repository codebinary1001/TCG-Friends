import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { useTheme } from '../context/ThemeContext';
import { Sparkles, Bell, Copy, Check, UserPlus, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddFriend: () => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab: _currentTab,
  onTabChange,
  onOpenAddFriend,
  onOpenNotifications,
}) => {
  const { currentUser } = useAuth();
  const { unreadCount } = useRealtime();
  const { isDark, toggleTheme } = useTheme();
  const [copied, setCopied] = useState(false);

  const copyTCGId = () => {
    if (currentUser) {
      navigator.clipboard.writeText(currentUser.tcgId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onTabChange('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-[200px] bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/25 flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[200px] flex items-center justify-center group-hover:bg-amber-50 dark:group-hover:bg-slate-900 transition-colors">
              <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400 animate-pulse" />
            </div>
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            TCG <span className="text-amber-500 dark:text-amber-400">Friends</span>
          </span>
        </div>

        {/* Right: TCG ID, Theme Toggle, Notifications, Add Friend, Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentUser && (
            <button
              onClick={copyTCGId}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[200px] bg-amber-50 hover:bg-amber-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold transition-all shadow-sm group"
              title="Click to copy your TCG ID"
            >
              <span>{currentUser.tcgId}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
              )}
            </button>
          )}

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800 shadow-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Add friend button */}
          <button
            onClick={onOpenAddFriend}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-xs font-semibold transition-colors shadow-sm"
            title="Add Friend by TCG ID"
          >
            <UserPlus className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="hidden sm:inline">Add Friend</span>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800 shadow-sm"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 rounded-[200px] font-black text-[10px] flex items-center justify-center shadow-md animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar button -> jumps to profile */}
          {currentUser && (
            <button
              onClick={() => onTabChange('profile')}
              className="relative p-0.5 rounded-[200px] ring-2 ring-amber-400/60 hover:ring-amber-400 transition-all overflow-hidden"
              title="View Profile"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-8 h-8 rounded-[200px] object-cover bg-slate-100 dark:bg-slate-900"
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

