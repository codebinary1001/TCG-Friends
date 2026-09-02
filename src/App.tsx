import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider, useRealtime } from './context/RealtimeContext';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AddFriendModal } from './components/AddFriendModal';
import { NotificationCenter } from './components/NotificationCenter';
import { TutorialModal } from './components/TutorialModal';
import { CardRevealModal } from './components/CardRevealModal';

import { HomeView } from './views/HomeView';
import { DiscoverView } from './views/DiscoverView';
import { FriendsView } from './views/FriendsView';
import { CollectionView } from './views/CollectionView';
import { LeaderboardView } from './views/LeaderboardView';
import { ProfileView } from './views/ProfileView';

const AppContent: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const { unlockedCard, setUnlockedCard } = useRealtime();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; mode: 'login' | 'signup' }>({
    isOpen: false,
    mode: 'signup',
  });
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [targetFriendChatId, setTargetFriendChatId] = useState<string | undefined>(undefined);

  // Trigger tutorial if new user hasn't completed it
  useEffect(() => {
    if (currentUser && currentUser.hasCompletedTutorial === false) {
      setIsTutorialOpen(true);
    }
  }, [currentUser]);

  const handleNavigate = (tab: string, extra?: any) => {
    if (tab === 'friends' && extra?.selectedFriendId) {
      setTargetFriendChatId(extra.selectedFriendId);
    }
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToChat = (friendId: string) => {
    setTargetFriendChatId(friendId);
    setCurrentTab('friends');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-900 dark:text-white transition-colors duration-200">
        <div className="w-12 h-12 border-3 border-amber-500 dark:border-amber-400 border-t-transparent rounded-full animate-spin shadow-lg shadow-amber-500/20" />
        <div className="text-sm font-bold text-amber-600 dark:text-amber-300 tracking-wider uppercase animate-pulse">
          Loading TCG Friends...
        </div>
      </div>
    );
  }

  // Not logged in -> Show Landing Page
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode) => setAuthModalState({ isOpen: true, mode })}
        />

        <AuthModal
          isOpen={authModalState.isOpen}
          initialMode={authModalState.mode}
          onClose={() => setAuthModalState({ isOpen: false, mode: 'signup' })}
        />
      </>
    );
  }

  // Authenticated App Shell
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-amber-400 selection:text-slate-950 flex flex-col pb-24 transition-colors duration-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => handleNavigate(tab)}
        onOpenAddFriend={() => setIsAddFriendOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main View Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20">
        {currentTab === 'home' && (
          <HomeView
            onNavigate={handleNavigate}
            onOpenAddFriend={() => setIsAddFriendOpen(true)}
          />
        )}

        {currentTab === 'discover' && (
          <DiscoverView
            onNavigateToChat={handleNavigateToChat}
            onOpenAddFriend={() => setIsAddFriendOpen(true)}
          />
        )}

        {currentTab === 'friends' && (
          <FriendsView
            initialFriendId={targetFriendChatId}
            onOpenAddFriend={() => setIsAddFriendOpen(true)}
            onNavigateToCollection={() => handleNavigate('collection')}
          />
        )}

        {currentTab === 'collection' && (
          <CollectionView
            onOpenAddFriend={() => setIsAddFriendOpen(true)}
            onNavigateToDiscover={() => handleNavigate('discover')}
          />
        )}

        {currentTab === 'leaderboard' && (
          <LeaderboardView
            onOpenAddFriend={() => setIsAddFriendOpen(true)}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            onReplayTutorial={() => setIsTutorialOpen(true)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => handleNavigate(tab)}
      />

      {/* Global Modals */}
      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        onFriendRequestSent={() => setIsAddFriendOpen(false)}
      />

      <NotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateToTab={(tab) => handleNavigate(tab)}
      />

      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* Legendary Card Unlocked Celebration Modal */}
      <CardRevealModal
        card={unlockedCard}
        onClose={() => setUnlockedCard(null)}
        onStartChat={(friendId) => {
          setUnlockedCard(null);
          handleNavigateToChat(friendId);
        }}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RealtimeProvider>
          <AppContent />
        </RealtimeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
