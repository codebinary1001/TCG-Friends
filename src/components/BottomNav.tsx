import React from 'react';
import { Sparkles, Compass, Users, Layers, Trophy, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'collection', label: 'Collection', icon: Layers },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] w-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-[200px] p-1.5 sm:p-2 shadow-xl shadow-slate-900/10 dark:shadow-black/80 flex items-center gap-1 sm:gap-2 ring-1 ring-slate-900/5 dark:ring-white/10 transition-colors duration-200">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-[200px] text-xs font-bold transition-all ${
              isActive
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/25 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span className="text-xs tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};


