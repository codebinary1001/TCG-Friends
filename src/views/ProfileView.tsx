import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CardTheme, AvailabilitySlot, BlockedUserRecord } from '../types/tcg';
import { Card3D } from '../components/Card3D';
import {
  User,
  Sparkles,
  Copy,
  Check,
  Camera,
  Calendar,
  Clock,
  MapPin,
  Heart,
  Shield,
  HelpCircle,
  LogOut,
  Save,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  UserX,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileViewProps {
  onReplayTutorial: () => void;
}

const THEME_OPTIONS: { id: CardTheme; name: string; icon: string; previewColor: string }[] = [
  { id: 'holographic_gold', name: 'Solar Radiance (Gold)', icon: '✨', previewColor: 'from-amber-400 to-yellow-600' },
  { id: 'neon_cyber', name: 'Cyber Matrix (Cyan)', icon: '⚡', previewColor: 'from-cyan-400 to-fuchsia-600' },
  { id: 'cosmic_void', name: 'Cosmic Nebula (Purple)', icon: '🌌', previewColor: 'from-purple-400 to-indigo-600' },
  { id: 'emerald_nature', name: 'Verdant Forest (Emerald)', icon: '🌿', previewColor: 'from-emerald-400 to-teal-600' },
  { id: 'inferno_red', name: 'Blazing Ember (Crimson)', icon: '🔥', previewColor: 'from-rose-500 to-amber-600' },
  { id: 'aurora_borealis', name: 'Polar Lights (Aurora)', icon: '❄️', previewColor: 'from-teal-300 to-indigo-400' },
  { id: 'amethyst_arcane', name: 'Arcane Crystal (Violet)', icon: '🔮', previewColor: 'from-fuchsia-400 to-purple-600' },
  { id: 'obsidian_chrome', name: 'Obsidian Chrome (Platinum)', icon: '🛡️', previewColor: 'from-slate-300 to-zinc-600' },
  { id: 'custom', name: 'Custom Color Wheel', icon: '🎨', previewColor: 'from-rose-400 via-amber-300 to-cyan-400' },
];

const PRESET_CUSTOM_SWATCHES = [
  { name: 'Electric Pink', hex: '#ec4899' },
  { name: 'Neon Lime', hex: '#84cc16' },
  { name: 'Cyan Blast', hex: '#06b6d4' },
  { name: 'Ultra Violet', hex: '#a855f7' },
  { name: 'Sunset Amber', hex: '#f59e0b' },
  { name: 'Coral Rose', hex: '#f43f5e' },
  { name: 'Mint Emerald', hex: '#10b981' },
  { name: 'Deep Indigo', hex: '#6366f1' },
];

const COMMON_HOBBY_TAGS = [
  'Gaming',
  'Anime & Manga',
  'Board Games',
  'Basketball',
  'Music Production',
  'Digital Art',
  'Hiking & Outdoors',
  'Cooking & Baking',
  'Fitness & Gym',
  'Coding & Tech',
  'Photography',
  'Sci-Fi Books',
  'Travel & Exploring',
  'Coffee & Cafes',
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Weekends', 'Weekdays'];

export const ProfileView: React.FC<ProfileViewProps> = ({ onReplayTutorial }) => {
  const { currentUser, updateProfile, logout } = useAuth();

  const [name, setName] = useState(currentUser?.name || '');
  const [age, setAge] = useState<number>(currentUser?.age || 20);
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [locationArea, setLocationArea] = useState(currentUser?.locationArea || '');
  const [hobbies, setHobbies] = useState<string[]>(currentUser?.hobbies || []);
  const [customHobbyInput, setCustomHobbyInput] = useState('');
  const [favoriteActivities, setFavoriteActivities] = useState((currentUser?.favoriteActivities || []).join(', '));
  const [cardTheme, setCardTheme] = useState<CardTheme>(currentUser?.cardTheme || 'holographic_gold');
  const [customCardColor, setCustomCardColor] = useState(currentUser?.customCardColor || '#f59e0b');
  const [customQuote, setCustomQuote] = useState(currentUser?.customQuote || '');
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(currentUser?.availability || []);
  const [availabilityPrivacy, setAvailabilityPrivacy] = useState<'everyone' | 'friends_only' | 'nobody'>(
    currentUser?.availabilityPrivacy || 'everyone'
  );

  // New slot inputs
  const [newSlotDay, setNewSlotDay] = useState('Weekends');
  const [newSlotTime, setNewSlotTime] = useState('Afternoon (2 PM - 6 PM)');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Safety & Blocked users
  const [blockedUsers, setBlockedUsers] = useState<Array<{ id: string; blockedUserId: string; createdAt: string; profile?: any }>>([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const fetchBlockedUsers = async () => {
    const token = localStorage.getItem('tcg_auth_token');
    if (!token) return;
    setIsLoadingBlocked(true);
    try {
      const res = await fetch('/api/safety/blocked', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data.blocked || []);
      }
    } catch (e) {
      console.error('Failed to load blocked users', e);
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const handleUnblock = async (targetUserId: string) => {
    const token = localStorage.getItem('tcg_auth_token');
    if (!token) return;
    setUnblockingId(targetUserId);
    try {
      const res = await fetch('/api/safety/unblock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        setBlockedUsers((prev) => prev.filter((b) => b.blockedUserId !== targetUserId));
      }
    } catch (e) {
      console.error('Failed to unblock', e);
    } finally {
      setUnblockingId(null);
    }
  };

  const copyTCGId = () => {
    if (currentUser) {
      navigator.clipboard.writeText(currentUser.tcgId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          await updateProfile({ avatarUrl: base64 });
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2500);
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to update avatar');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePickDicebearAvatar = async (seed: string) => {
    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=0f172a`;
    try {
      await updateProfile({ avatarUrl });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleHobby = (tag: string) => {
    if (hobbies.includes(tag)) {
      setHobbies(hobbies.filter((h) => h !== tag));
    } else {
      if (hobbies.length < 8) {
        setHobbies([...hobbies, tag]);
      }
    }
  };

  const addCustomHobby = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customHobbyInput.trim()) {
      e.preventDefault();
      const val = customHobbyInput.trim();
      if (!hobbies.includes(val) && hobbies.length < 8) {
        setHobbies([...hobbies, val]);
      }
      setCustomHobbyInput('');
    }
  };

  const addAvailabilitySlot = () => {
    if (newSlotDay && newSlotTime) {
      setAvailability([...availability, { day: newSlotDay, timeRange: newSlotTime }]);
    }
  };

  const removeAvailabilitySlot = (index: number) => {
    setAvailability(availability.filter((_, i) => i !== index));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const activitiesArray = favoriteActivities
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await updateProfile({
        name: name.trim(),
        age: Number(age) || 18,
        bio: bio.trim(),
        locationArea: locationArea.trim(),
        hobbies,
        interests: hobbies,
        favoriteActivities: activitiesArray,
        cardTheme,
        customCardColor: cardTheme === 'custom' ? customCardColor : customCardColor,
        customQuote: customQuote.trim(),
        availability,
        availabilityPrivacy,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile updates');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[200px] bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-amber-300 dark:border-amber-500/30">
            <User className="w-3.5 h-3.5" />
            <span>Profile & Card Customizer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Your Collector Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
            Customize your bio, card theme, and availability schedule.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReplayTutorial}
            className="px-4 py-2.5 rounded-[200px] bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Replay Tutorial</span>
          </button>

          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-[200px] bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-[50px] bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 px-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-[50px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 px-6 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Profile & Legendary Card saved successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Edit Form */}
        <form onSubmit={handleSaveProfile} className="lg:col-span-2 space-y-6">
          {/* Avatar & TCG ID card */}
          <div className="p-6 rounded-[50px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Avatar & Permanent ID</h3>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group">
                <img
                  src={currentUser?.avatarUrl}
                  alt={currentUser?.name}
                  className="w-24 h-24 rounded-[200px] object-cover border-2 border-amber-400 shadow-xl bg-slate-100 dark:bg-slate-800"
                />
                <label className="absolute inset-0 rounded-[200px] bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer transition-opacity">
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="font-black text-slate-900 dark:text-white text-lg">{currentUser?.name}</span>
                  <button
                    type="button"
                    onClick={copyTCGId}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[200px] bg-slate-100 dark:bg-black/60 border border-amber-400/60 text-amber-700 dark:text-amber-300 font-mono text-xs font-bold cursor-pointer"
                  >
                    <span>{currentUser?.tcgId}</span>
                    {copiedId ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your TCG ID is permanent. Share it with anyone to add them instantly!
                </p>

                {/* Quick Avatar Presets */}
                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">Or pick preset:</span>
                  {['cyber', 'shadow', 'blaze', 'nebula'].map((seed) => (
                    <button
                      type="button"
                      key={seed}
                      onClick={() => handlePickDicebearAvatar(seed)}
                      className="text-[10px] px-2 py-0.5 rounded-[200px] bg-slate-100 dark:bg-slate-800 hover:bg-amber-400 hover:text-slate-950 dark:hover:bg-amber-400 dark:hover:text-slate-950 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {seed}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="p-6 rounded-[50px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Personal Info</h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] px-4 py-2.5 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Age (7+)</label>
                <input
                  type="number"
                  required
                  min={7}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] px-4 py-2.5 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                General Location Area (e.g. "Seattle, WA" or "London, UK")
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={locationArea}
                  onChange={(e) => setLocationArea(e.target.value)}
                  placeholder="e.g. Austin, TX"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] pl-10 pr-4 py-2.5 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others what you love doing, what kind of friendships you are looking for..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[50px] p-4 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 resize-none px-6 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Hobbies & Interests */}
          <div className="p-6 rounded-[50px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Hobbies & Interests ({hobbies.length}/8)</h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Used by AI matching engine</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-3 bg-slate-50 dark:bg-slate-950/40 rounded-[50px] border border-slate-200 dark:border-slate-800">
              {COMMON_HOBBY_TAGS.map((tag) => {
                const isSelected = hobbies.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleHobby(tag)}
                    className={`px-3.5 py-1.5 rounded-[200px] text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent'
                    }`}
                  >
                    {tag} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={customHobbyInput}
              onChange={(e) => setCustomHobbyInput(e.target.value)}
              onKeyDown={addCustomHobby}
              placeholder="+ Add custom hobby (press Enter)"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] px-4 py-2.5 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Favorite Activities (Comma-separated)
              </label>
              <input
                type="text"
                value={favoriteActivities}
                onChange={(e) => setFavoriteActivities(e.target.value)}
                placeholder="e.g. Board Game Nights, Hiking, Movie Marathons"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] px-4 py-2.5 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Elemental Card Theme & Custom Quote */}
          <div className="p-6 rounded-[50px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Legendary Card Customization</h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Card Elemental Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {THEME_OPTIONS.map((th) => (
                  <button
                    type="button"
                    key={th.id}
                    onClick={() => setCardTheme(th.id)}
                    className={`p-3 rounded-[50px] border text-left transition-all cursor-pointer ${
                      cardTheme === th.id
                        ? 'bg-amber-500/15 border-amber-400 shadow-xs text-slate-900 dark:text-white font-bold'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="text-base mb-1">{th.icon}</div>
                    <div className="font-bold text-xs truncate">{th.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Browser Color Wheel Section (Active when custom theme selected) */}
            {cardTheme === 'custom' && (
              <div className="p-4 rounded-[50px] bg-slate-50 dark:bg-slate-950/80 border border-amber-400/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎨</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Browser Color Wheel</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Pick any custom shade or enter hex</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Browser Color Wheel Input */}
                    <label className="relative flex items-center justify-center cursor-pointer p-1 rounded-[200px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-amber-400 transition-colors shadow-inner">
                      <input
                        type="color"
                        value={customCardColor}
                        onChange={(e) => {
                          setCustomCardColor(e.target.value);
                          setCardTheme('custom');
                        }}
                        className="w-8 h-8 rounded-[200px] cursor-pointer bg-transparent border-0 opacity-0 absolute inset-0 z-10"
                      />
                      <div
                        className="w-7 h-7 rounded-[200px] shadow-md border border-white/20"
                        style={{ backgroundColor: customCardColor }}
                      />
                    </label>

                    <input
                      type="text"
                      value={customCardColor}
                      onChange={(e) => {
                        setCustomCardColor(e.target.value);
                        setCardTheme('custom');
                      }}
                      placeholder="#ff0055"
                      className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[200px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-1">
                  <div className="text-[10px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                    Popular Chromas
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_CUSTOM_SWATCHES.map((swatch) => (
                      <button
                        type="button"
                        key={swatch.hex}
                        onClick={() => {
                          setCustomCardColor(swatch.hex);
                          setCardTheme('custom');
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[200px] text-[11px] font-medium border transition-transform hover:scale-105 cursor-pointer ${
                          customCardColor.toLowerCase() === swatch.hex.toLowerCase()
                            ? 'border-amber-400 dark:border-white text-slate-900 dark:text-white font-bold bg-amber-400/20 dark:bg-white/10'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-[200px] shadow-xs"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span>{swatch.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Custom Friendship Lore / Quote (Printed on your card)
              </label>
              <input
                type="text"
                value={customQuote}
                onChange={(e) => setCustomQuote(e.target.value)}
                placeholder="e.g. Adventure is always better in co-op mode!"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] px-4 py-2.5 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Weekly Availability Scheduler */}
          <div className="p-6 rounded-[50px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Availability Schedule</h3>
              </div>

              {/* Privacy selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Visible to:</span>
                <select
                  value={availabilityPrivacy}
                  onChange={(e) => setAvailabilityPrivacy(e.target.value as any)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-[200px] px-3 py-1.5 focus:outline-none cursor-pointer"
                >
                  <option value="everyone">Everyone</option>
                  <option value="friends_only">Friends Only</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>
            </div>

            {/* Existing slots */}
            <div className="space-y-2">
              {availability.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">No availability slots configured.</p>
              ) : (
                availability.map((slot, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-[200px] bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 px-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-700 dark:text-amber-300">{slot.day}:</span>
                      <span>{slot.timeRange}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAvailabilitySlot(idx)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add slot controls */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <select
                value={newSlotDay}
                onChange={(e) => setNewSlotDay(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] px-4 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none cursor-pointer"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={newSlotTime}
                onChange={(e) => setNewSlotTime(e.target.value)}
                placeholder="e.g. Evenings (7 PM - 10 PM)"
                className="flex-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] px-4 py-2.5 text-slate-900 dark:text-white text-xs focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />

              <button
                type="button"
                onClick={addAvailabilitySlot}
                className="w-full sm:w-auto px-5 py-2.5 rounded-[200px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-transparent transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Add Slot</span>
              </button>
            </div>
          </div>

          {/* Safety & Blocked Users Management */}
          <div className="p-6 rounded-[50px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Safety & Blocked Users
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Manage users you have restricted from contacting you
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fetchBlockedUsers}
                disabled={isLoadingBlocked}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Refresh blocked list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBlocked ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {blockedUsers.length === 0 ? (
              <div className="p-4 rounded-[30px] bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <UserX className="w-5 h-5 text-slate-400 mx-auto" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  No blocked users
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  You haven't blocked anyone. You can block or report any profile at any time.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {blockedUsers.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-[24px] bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.profile?.avatarUrl ? (
                        <img
                          src={item.profile.avatarUrl}
                          alt={item.profile.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                          {item.profile?.name ? item.profile.name.charAt(0) : '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.profile?.name || 'Blocked User'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                          {item.profile?.tcgId || item.blockedUserId}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUnblock(item.blockedUserId)}
                      disabled={unblockingId === item.blockedUserId}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {unblockingId === item.blockedUserId ? 'Unblocking...' : 'Unblock'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 px-6 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-sm tracking-wide transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-[200px] animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile & Card Changes</span>
              </>
            )}
          </button>
        </form>

        {/* Right 1 Column: Live 3D Card Preview */}
        <div className="space-y-4">
          <div className="sticky top-24 space-y-3">
            <div className="text-center">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Live Card Preview</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                This is the Legendary Card others unlock when they friend you!
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <Card3D
                cardData={{
                  name: name || currentUser?.name || 'Collector',
                  age: age || 20,
                  tcgId: currentUser?.tcgId || 'TCG-000000',
                  avatarUrl: currentUser?.avatarUrl || '',
                  bio: bio,
                  hobbies: hobbies,
                  interests: hobbies,
                  favoriteActivities: favoriteActivities.split(',').filter(Boolean),
                  locationArea: locationArea,
                  cardTheme: cardTheme,
                  customCardColor: customCardColor,
                  customQuote: customQuote,
                  friendshipDate: new Date().toISOString(),
                  streakDays: 1,
                  milestones: ['friendship_started'],
                }}
                size="md"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
