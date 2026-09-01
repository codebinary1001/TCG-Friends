import React from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { Bell, Check, Sparkles, MessageCircle, UserPlus, Flame, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const { notifications, markNotificationRead, clearAllNotifications } = useRealtime();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'card_unlocked':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-emerald-400" />;
      case 'streak_milestone':
        return <Flame className="w-4 h-4 text-orange-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  const handleItemClick = (notif: any) => {
    markNotificationRead(notif.id);
    if (notif.type === 'friend_request' || notif.type === 'friend_accept') {
      onNavigateToTab?.('friends');
      onClose();
    } else if (notif.type === 'card_unlocked') {
      onNavigateToTab?.('collection');
      onClose();
    } else if (notif.type === 'message') {
      onNavigateToTab?.('friends');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="w-full max-w-sm h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Notifications</h3>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="px-2.5 py-0.5 rounded-[200px] bg-amber-500 text-slate-950 font-extrabold text-xs">
                {notifications.filter((n) => !n.read).length} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="p-2 rounded-[200px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Mark all as read"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-[200px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-1" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No notifications yet</p>
              <p className="text-xs text-slate-500">
                You'll receive alerts when someone adds you, messages you, or when you unlock new cards!
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`p-3.5 rounded-[200px] border transition-all cursor-pointer flex items-start gap-3 px-4 ${
                  n.read
                    ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                    : 'bg-amber-500/10 dark:bg-slate-800/80 border-amber-400/40 dark:border-amber-500/30 text-slate-900 dark:text-white shadow-xs hover:bg-amber-500/15 dark:hover:bg-slate-800'
                }`}
              >
                <div className="p-2 rounded-[200px] bg-slate-100 dark:bg-slate-950/60 shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 shrink-0">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">{n.body}</p>
                </div>

                {!n.read && (
                  <span className="w-2 h-2 rounded-[200px] bg-amber-500 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
