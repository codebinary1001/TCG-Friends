import React from 'react';
import { Card3D } from './Card3D';
import { CardSnapshot } from '../types/tcg';
import { Sparkles, Compass, MessageCircle, UserCheck, Trophy, Flame, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

const SAMPLE_SHOWCASE_CARDS: CardSnapshot[] = [
  {
    name: 'Sarah Chen',
    age: 23,
    tcgId: 'TCG-SRH9214',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    bio: 'Indie game developer & matcha lover. Always down for co-op campaigns!',
    hobbies: ['Indie Gaming', 'Pixel Art', 'Coffee Brewing'],
    interests: ['Pixel Art', 'Co-op RPGs'],
    favoriteActivities: ['Weekend Hackathons', 'Board Game Nights'],
    locationArea: 'Seattle, WA',
    cardTheme: 'neon_cyber',
    customQuote: 'Adventure is better in co-op mode!',
    friendshipDate: '2026-06-12',
    streakDays: 19,
    milestones: ['friendship_started', 'first_chat', 'streak_7', 'first_activity'],
  },
  {
    name: 'Marcus Vance',
    age: 26,
    tcgId: 'TCG-MRC4082',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    bio: 'Bouldering enthusiast, street photographer, and lofi beatmaker.',
    hobbies: ['Bouldering', 'Photography', 'Music Production'],
    interests: ['Lofi Beats', 'Street Photo'],
    favoriteActivities: ['Climbing Gym', 'Vinyl Hunting'],
    locationArea: 'Austin, TX',
    cardTheme: 'holographic_gold',
    customQuote: 'Every friendship is a legendary story.',
    friendshipDate: '2026-07-04',
    streakDays: 42,
    milestones: ['friendship_started', 'first_call', 'streak_7', 'streak_30'],
  },
  {
    name: 'Elena Rostova',
    age: 22,
    tcgId: 'TCG-ELN7731',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    bio: 'Astrophysics student who loves stargazing and ambient synthesizers.',
    hobbies: ['Astronomy', 'Synthesizers', 'Sci-Fi Books'],
    interests: ['Stargazing', 'Ambient Music'],
    favoriteActivities: ['Telescope Nights', 'Book Clubs'],
    locationArea: 'Toronto, CA',
    cardTheme: 'cosmic_void',
    customQuote: 'Look to the stars and find your crew.',
    friendshipDate: '2026-08-01',
    streakDays: 14,
    milestones: ['friendship_started', 'first_chat', 'streak_7'],
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[200px] bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[200px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              TCG <span className="text-amber-400">Friends</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-4 py-2 rounded-[200px] text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-4 py-2 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold text-sm transition-all shadow-md shadow-amber-500/20"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[200px] bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-xs uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Collectible Friendship Network</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] text-white">
            Meet people. <br />
            Make friends. <br />
            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
              Collect them all.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Discover people you might actually get along with, make new friends, and collect a unique <strong>Legendary TCG Card</strong> for every friendship.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto px-8 py-4 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-base transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="w-full sm:w-auto px-8 py-4 rounded-[200px] bg-slate-900 hover:bg-slate-800 text-white font-bold text-base transition-colors border border-slate-800"
            >
              Log In
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Real Registered Users Only</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Every Card is Strictly Legendary</span>
            </div>
          </div>
        </div>

        {/* 3D Cards Showcase Deck */}
        <div className="mt-16 sm:mt-20">
          <div className="text-center mb-6">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              Hover & Click cards to flip and inspect holographic lore
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            {SAMPLE_SHOWCASE_CARDS.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
                className="transform transition-transform hover:-translate-y-2 duration-300"
              >
                <Card3D cardData={card} size="md" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs uppercase tracking-widest text-amber-400 font-extrabold mb-2">
              Simple & Fun Social Flow
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white">
              How TCG Friends Works
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Turn genuine real-world friendships into a vibrant collectible deck.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-[50px] bg-slate-950 border border-slate-800 flex flex-col justify-between hover:border-amber-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-[200px] bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-lg">
                  1
                </div>
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Compass className="w-4 h-4" />
                  <span>Discover</span>
                </div>
                <h4 className="text-lg font-bold text-white">Daily AI Picks</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every day, AI recommends 3 real people who you might get along with based on your actual hobbies, availability, and interests.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-[50px] bg-slate-950 border border-slate-800 flex flex-col justify-between hover:border-cyan-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-[200px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-lg">
                  2
                </div>
                <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                  <MessageCircle className="w-4 h-4" />
                  <span>Connect</span>
                </div>
                <h4 className="text-lg font-bold text-white">Chat or Call</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Chat, send voice notes, or start real-time HD audio/video calls to genuinely get to know each other.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-[50px] bg-slate-950 border border-slate-800 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-[200px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-lg">
                  3
                </div>
                <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                  <UserCheck className="w-4 h-4" />
                  <span>Become Friends</span>
                </div>
                <h4 className="text-lg font-bold text-white">Mutual Bond</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Send a friend request. Once both users accept, a permanent friendship is forged and your streak begins!
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-[50px] bg-slate-950 border border-slate-800 flex flex-col justify-between hover:border-purple-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-[200px] bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-black text-lg">
                  4
                </div>
                <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Collect</span>
                </div>
                <h4 className="text-lg font-bold text-white">Legendary Card</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Both users immediately receive each other’s unique Legendary TCG Card with custom theme and friendship lore.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-6 rounded-[50px] bg-slate-950 border border-slate-800 flex flex-col justify-between hover:border-yellow-500/40 transition-colors">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-[200px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center font-black text-lg">
                  5
                </div>
                <div className="flex items-center gap-1.5 text-yellow-300 text-xs font-bold uppercase tracking-wider">
                  <Trophy className="w-4 h-4" />
                  <span>Compete</span>
                </div>
                <h4 className="text-lg font-bold text-white">Leaderboards</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Build your collection (1 unique friend = 1 card = 1 point) and climb the Global, Monthly, and Weekly leaderboards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE PHILOSOPHY & ANTI-CHEAT */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-[50px] bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[200px] bg-amber-500/20 text-amber-300 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Strict Social Equity</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              No Rarity Hierarchy. <br />
              <span className="text-amber-400">Every Single Card Is Legendary.</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              In TCG Friends, no human being is a "common" or "rare". Everyone gets an equally magnificent Legendary card. Leaderboard ranks are earned solely by how many unique genuine friends you meet and collect.
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-4 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/25 text-center cursor-pointer"
            >
              Join Now & Claim Your TCG ID
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-800 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} TCG Friends. Connect genuinely, build your deck, make lifelong friends.</p>
        </div>
      </footer>
    </div>
  );
};
