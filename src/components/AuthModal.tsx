import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, X, Mail, Lock, User as UserIcon, Calendar, MapPin, Heart, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

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

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signup',
}) => {
  const { login, register, resetPassword } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset-password'>(initialMode);
  const [step, setStep] = useState<1 | 2>(1); // For signup multi-step

  // Sync mode when initialMode prop changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStep(1);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [bio, setBio] = useState('');
  const [locationArea, setLocationArea] = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [customHobbyInput, setCustomHobbyInput] = useState('');
  const [favoriteActivities, setFavoriteActivities] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleHobby = (h: string) => {
    if (selectedHobbies.includes(h)) {
      setSelectedHobbies(selectedHobbies.filter((item) => item !== h));
    } else {
      if (selectedHobbies.length < 8) {
        setSelectedHobbies([...selectedHobbies, h]);
      }
    }
  };

  const addCustomHobby = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customHobbyInput.trim()) {
      e.preventDefault();
      const val = customHobbyInput.trim();
      if (!selectedHobbies.includes(val) && selectedHobbies.length < 8) {
        setSelectedHobbies([...selectedHobbies, val]);
      }
      setCustomHobbyInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (mode === 'signup' && step === 1) {
      if (!name.trim()) return setErrorMsg('Please enter your name.');
      if (!age || Number(age) < 7) return setErrorMsg('You must be at least 7 years old to join.');
      if (!email.trim() || !password) return setErrorMsg('Email and password are required.');
      if (password.length < 6) return setErrorMsg('Password must be at least 6 characters.');
      setStep(2);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
        onClose();
      } else if (mode === 'signup') {
        const activitiesArray = favoriteActivities
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        await register({
          email: email.trim(),
          password,
          name: name.trim(),
          age: Number(age) || 18,
          bio: bio.trim(),
          hobbies: selectedHobbies,
          interests: selectedHobbies,
          favoriteActivities: activitiesArray,
          locationArea: locationArea.trim(),
        });
        onClose();
      } else if (mode === 'reset-password') {
        const msg = await resetPassword(email.trim(), password);
        setSuccessMsg(msg);
        setTimeout(() => setMode('login'), 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[50px] p-6 sm:p-8 shadow-2xl my-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-[200px] bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-[200px] bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-amber-300 dark:border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-center text-[12px]">TCG Friends</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {mode === 'login' && 'Welcome Back!'}
            {mode === 'signup' && (step === 1 ? 'Create Your Account' : 'Build Your Card Profile')}
            {mode === 'reset-password' && 'Reset Your Password'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'login' && 'Log in to view your friends, chats, and Legendary Card collection.'}
            {mode === 'signup' && (step === 1 ? 'Get your unique TCG ID and join the global friendship community.' : 'Customize your real interests so AI can match you with great friends.')}
            {mode === 'reset-password' && 'Enter your email and your new password.'}
          </p>
        </div>

        {/* Form Error / Success banners */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-[200px] bg-rose-500/15 border border-rose-500/40 text-rose-800 dark:text-rose-200 text-xs flex flex-col gap-2 px-5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
              <span className="font-medium">{errorMsg}</span>
            </div>
            {mode === 'login' && errorMsg.toLowerCase().includes('no account') && (
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setStep(1);
                  setErrorMsg(null);
                }}
                className="self-start text-[11px] font-bold text-amber-600 dark:text-amber-400 underline hover:text-amber-700 dark:hover:text-amber-300"
              >
                → Click here to Sign Up with "{email}"
              </button>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-[200px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 px-5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'login' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-2">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] pl-11 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-2">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] pl-11 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end px-2">
                <button
                  type="button"
                  onClick={() => setMode('reset-password')}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {mode === 'reset-password' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-2">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] pl-11 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-2">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] pl-11 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'signup' && step === 1 && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-2">Your Name</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-3.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] pl-11 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-2">Age (7+)</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="number"
                      required
                      min={7}
                      max={120}
                      value={age}
                      onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                      placeholder="10"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] pl-9 pr-3 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-2">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] pl-11 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-2">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] pl-11 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'signup' && step === 2 && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-2">General Area / City (No exact address)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={locationArea}
                    onChange={(e) => setLocationArea(e.target.value)}
                    placeholder="e.g. Austin, TX or London, UK"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] pl-11 pr-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-400 shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 ml-2">
                  Pick Your Hobbies & Interests ({selectedHobbies.length}/8)
                </label>
                <div className="flex flex-wrap gap-1.5 my-2 max-h-32 overflow-y-auto p-2.5 bg-slate-50 dark:bg-slate-950/40 rounded-[50px] border border-slate-200 dark:border-slate-800">
                  {COMMON_HOBBY_TAGS.map((tag) => {
                    const isSelected = selectedHobbies.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleHobby(tag)}
                        className={`px-3 py-1 rounded-[200px] text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent'
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
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[200px] px-4 py-2 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-400 mt-1 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-2">Short Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Say a little about yourself, what you like doing with friends..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[50px] p-3.5 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-amber-400 resize-none shadow-inner px-5 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-[200px] bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-[200px] animate-spin" />
            ) : mode === 'signup' && step === 1 ? (
              <>
                <span>Next: Customize Profile</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <span>{mode === 'login' ? 'Log In to TCG Friends' : mode === 'signup' ? 'Complete Profile & Get TCG ID' : 'Reset Password'}</span>
            )}
          </button>
        </form>

        {/* Modal Switchers */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setStep(1);
                  setErrorMsg(null);
                }}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Sign Up Free
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
              >
                Log In
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
