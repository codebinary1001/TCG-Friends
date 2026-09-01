import React, { useState, useRef } from 'react';
import { CardTheme, CardSnapshot } from '../types/tcg';
import { Sparkles, Flame, Calendar, Copy, Check, RotateCw, Award, Heart, Shield, Compass, MapPin } from 'lucide-react';

interface Card3DProps {
  cardData: CardSnapshot;
  size?: 'sm' | 'md' | 'lg';
  isFlipped?: boolean;
  onFlip?: () => void;
  interactive?: boolean;
}

const THEME_STYLES: Record<
  CardTheme,
  {
    bgGradient: string;
    borderColor: string;
    glowShadow: string;
    foilOverlay: string;
    textColor: string;
    accentColor: string;
    elementName: string;
    icon: string;
  }
> = {
  holographic_gold: {
    bgGradient: 'from-amber-950 via-yellow-900 to-amber-950',
    borderColor: 'border-amber-400',
    glowShadow: 'shadow-[0_0_25px_rgba(245,158,11,0.45)]',
    foilOverlay: 'bg-gradient-to-tr from-amber-400/20 via-yellow-300/30 to-amber-600/20',
    textColor: 'text-amber-200',
    accentColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    elementName: 'Solar Radiance',
    icon: '✨',
  },
  neon_cyber: {
    bgGradient: 'from-slate-950 via-cyan-950 to-purple-950',
    borderColor: 'border-cyan-400',
    glowShadow: 'shadow-[0_0_25px_rgba(6,182,212,0.45)]',
    foilOverlay: 'bg-gradient-to-tr from-cyan-400/20 via-fuchsia-400/25 to-blue-500/20',
    textColor: 'text-cyan-200',
    accentColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    elementName: 'Cyber Matrix',
    icon: '⚡',
  },
  cosmic_void: {
    bgGradient: 'from-purple-950 via-indigo-950 to-slate-950',
    borderColor: 'border-purple-400',
    glowShadow: 'shadow-[0_0_25px_rgba(168,85,247,0.45)]',
    foilOverlay: 'bg-gradient-to-tr from-purple-400/20 via-pink-400/25 to-indigo-600/20',
    textColor: 'text-purple-200',
    accentColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    elementName: 'Cosmic Nebula',
    icon: '🌌',
  },
  emerald_nature: {
    bgGradient: 'from-emerald-950 via-teal-950 to-green-950',
    borderColor: 'border-emerald-400',
    glowShadow: 'shadow-[0_0_25px_rgba(16,185,129,0.45)]',
    foilOverlay: 'bg-gradient-to-tr from-emerald-400/20 via-teal-300/25 to-lime-500/20',
    textColor: 'text-emerald-200',
    accentColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    elementName: 'Verdant Forest',
    icon: '🌿',
  },
  inferno_red: {
    bgGradient: 'from-red-950 via-orange-950 to-zinc-950',
    borderColor: 'border-rose-500',
    glowShadow: 'shadow-[0_0_25px_rgba(244,63,94,0.45)]',
    foilOverlay: 'bg-gradient-to-tr from-rose-500/20 via-amber-400/25 to-red-600/20',
    textColor: 'text-rose-200',
    accentColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    elementName: 'Blazing Ember',
    icon: '🔥',
  },
  aurora_borealis: {
    bgGradient: 'from-teal-950 via-indigo-950 to-sky-950',
    borderColor: 'border-teal-300',
    glowShadow: 'shadow-[0_0_25px_rgba(45,212,191,0.45)]',
    foilOverlay: 'bg-gradient-to-tr from-teal-300/20 via-sky-400/25 to-indigo-400/20',
    textColor: 'text-teal-200',
    accentColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    elementName: 'Polar Lights',
    icon: '❄️',
  },
  amethyst_arcane: {
    bgGradient: 'from-fuchsia-950 via-purple-950 to-violet-950',
    borderColor: 'border-fuchsia-400',
    glowShadow: 'shadow-[0_0_25px_rgba(217,70,239,0.45)]',
    foilOverlay: 'bg-gradient-to-tr from-fuchsia-400/20 via-violet-300/25 to-pink-500/20',
    textColor: 'text-fuchsia-200',
    accentColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    elementName: 'Arcane Crystal',
    icon: '🔮',
  },
  obsidian_chrome: {
    bgGradient: 'from-neutral-950 via-zinc-900 to-black',
    borderColor: 'border-neutral-300',
    glowShadow: 'shadow-[0_0_25px_rgba(212,212,216,0.35)]',
    foilOverlay: 'bg-gradient-to-tr from-zinc-300/15 via-white/20 to-neutral-400/15',
    textColor: 'text-neutral-200',
    accentColor: 'bg-zinc-700/40 text-neutral-200 border-zinc-500/40',
    elementName: 'Obsidian Chrome',
    icon: '🛡️',
  },
  custom: {
    bgGradient: 'from-slate-950 via-slate-900 to-black',
    borderColor: 'border-amber-400',
    glowShadow: 'shadow-[0_0_25px_rgba(245,158,11,0.45)]',
    foilOverlay: 'bg-gradient-to-tr from-white/20 via-amber-300/20 to-cyan-400/20',
    textColor: 'text-white',
    accentColor: 'bg-white/15 text-white border-white/30',
    elementName: 'Chroma Prism',
    icon: '🎨',
  },
};

function hexToRgb(hex?: string): [number, number, number] {
  if (!hex) return [245, 158, 11];
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [245, 158, 11];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export const Card3D: React.FC<Card3DProps> = ({
  cardData,
  size = 'md',
  isFlipped: controlledFlipped,
  onFlip,
  interactive = true,
}) => {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;
  const isCustom = cardData.cardTheme === 'custom';
  const customColor = cardData.customCardColor || '#f59e0b';
  const [r, g, b] = hexToRgb(customColor);

  const theme = isCustom
    ? {
        bgGradient: '',
        borderColor: '',
        glowShadow: '',
        foilOverlay: '',
        textColor: 'text-white',
        accentColor: '',
        elementName: `Chroma Prism`,
        icon: '🎨',
      }
    : (THEME_STYLES[cardData.cardTheme] || THEME_STYLES.holographic_gold);

  const customCardFrontBackStyle: React.CSSProperties = isCustom
    ? {
        background: `linear-gradient(160deg, rgba(${r}, ${g}, ${b}, 0.42) 0%, rgba(15, 23, 42, 0.94) 48%, rgba(2, 6, 23, 0.98) 100%)`,
        borderColor: customColor,
        borderWidth: '2.6px',
        boxShadow: `0 0 30px rgba(${r}, ${g}, ${b}, 0.5), 0 0 60px rgba(${r}, ${g}, ${b}, 0.22)`,
      }
    : {};

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -12;
    const rY = ((x - centerX) / centerX) * 12;

    setRotateX(rX);
    setRotateY(rY);
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // don't flip if clicking copy button
    if ((e.target as HTMLElement).closest('.copy-tcg-btn')) return;
    if (onFlip) {
      onFlip();
    } else {
      setInternalFlipped(!internalFlipped);
    }
  };

  const copyTCGId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cardData.tcgId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeClasses = {
    sm: 'w-48 h-72 text-xs',
    md: 'w-72 h-[430px] text-sm',
    lg: 'w-88 h-[520px] text-base',
  }[size];

  const formattedDate = cardData.friendshipDate
    ? new Date(cardData.friendshipDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div
      className="perspective-1000 select-none group cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      <div
        ref={cardRef}
        className={`relative ${sizeClasses} rounded-[50px] transition-transform duration-200 ease-out transform-style-3d ${!isCustom ? theme.glowShadow : ''}`}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY + (isFlipped ? 180 : 0)}deg)`,
          ...(isCustom ? { filter: `drop-shadow(0 0 20px rgba(${r}, ${g}, ${b}, 0.45))` } : {}),
        }}
      >
        {/* ================= FRONT SIDE ================= */}
        <div
          className={`absolute inset-0 w-full h-full rounded-[50px] ${!isCustom ? `bg-gradient-to-b ${theme.bgGradient} border-[2.6px] ${theme.borderColor}` : ''} p-3.5 flex flex-col justify-between overflow-hidden backface-hidden shadow-2xl`}
          style={customCardFrontBackStyle}
        >
          {/* Holographic foil shimmer layer */}
          <div
            className={`absolute inset-0 pointer-events-none ${!isCustom ? theme.foilOverlay : ''} mix-blend-overlay opacity-60 transition-opacity duration-300 group-hover:opacity-100`}
            style={{
              background: isCustom
                ? `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.5) 0%, rgba(${r},${g},${b},0.3) 40%, transparent 80%)`
                : `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 50%, transparent 80%)`,
            }}
          />

          {/* Top Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-[200px] bg-black/60 border shadow-sm backdrop-blur-md"
              style={{
                borderColor: isCustom ? `${customColor}99` : undefined,
              }}
            >
              <Sparkles
                className="w-3.5 h-3.5 animate-pulse"
                style={{ color: isCustom ? customColor : '#fbbf24' }}
              />
              <span
                className="font-extrabold text-[10px] tracking-wider uppercase"
                style={{ color: isCustom ? '#ffffff' : '#fcd34d' }}
              >
                LEGENDARY
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs">{theme.icon}</span>
              <span
                className="text-[10px] font-semibold tracking-tight text-white/90"
                style={{ color: isCustom ? customColor : undefined }}
              >
                {theme.elementName}
              </span>
            </div>
          </div>

          {/* Avatar / Portrait Frame */}
          <div className="relative z-10 my-auto flex flex-col items-center">
            <div
              className={`relative p-1 rounded-[200px] shadow-lg group-hover:scale-105 transition-transform duration-300 ${!isCustom ? 'bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500' : ''}`}
              style={{
                background: isCustom
                  ? `linear-gradient(135deg, ${customColor}, #ffffff 50%, ${customColor})`
                  : undefined,
              }}
            >
              <img
                src={cardData.avatarUrl}
                alt={cardData.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-[200px] object-cover bg-slate-900 border-2 border-slate-900"
              />
              <div
                className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-[200px] bg-black/80 border text-[10px] font-bold flex items-center gap-1 shadow-md"
                style={{
                  borderColor: isCustom ? `${customColor}cc` : undefined,
                  color: isCustom ? '#ffffff' : undefined,
                }}
              >
                <Flame
                  className="w-3 h-3"
                  style={{
                    color: isCustom ? customColor : '#f97316',
                    fill: isCustom ? customColor : '#f97316',
                  }}
                />
                <span>{cardData.streakDays || 1}d</span>
              </div>
            </div>

            {/* Name & TCG ID */}
            <div className="mt-2.5 text-center w-full px-2">
              <h3 className="font-black text-white text-base sm:text-lg tracking-wide truncate drop-shadow-md">
                {cardData.name}
              </h3>

              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <button
                  type="button"
                  onClick={copyTCGId}
                  className="copy-tcg-btn inline-flex items-center gap-1 px-2 py-0.5 rounded-[200px] bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-mono text-white/90 transition-colors"
                  title="Click to copy TCG ID"
                >
                  <span>{cardData.tcgId}</span>
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-white/60 hover:text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Middle Details: Hobbies & Quote */}
          <div className="relative z-10 space-y-2">
            {/* Custom Lore / Quote */}
            {cardData.customQuote && (
              <p className="text-[11px] italic text-center text-white/85 px-2 line-clamp-1">
                "{cardData.customQuote}"
              </p>
            )}

            {/* Hobbies Badges */}
            <div className="flex flex-wrap justify-center gap-1 max-h-12 overflow-hidden">
              {cardData.hobbies && cardData.hobbies.length > 0 ? (
                cardData.hobbies.slice(0, 3).map((h, i) => (
                  <span
                    key={i}
                    className={`px-2 py-0.5 rounded-[200px] text-[10px] font-medium border backdrop-blur-sm ${!isCustom ? theme.accentColor : ''}`}
                    style={
                      isCustom
                        ? {
                            backgroundColor: `rgba(${r}, ${g}, ${b}, 0.22)`,
                            color: '#ffffff',
                            borderColor: `rgba(${r}, ${g}, ${b}, 0.55)`,
                          }
                        : undefined
                    }
                  >
                    {h}
                  </span>
                ))
              ) : (
                <span className="px-2 py-0.5 rounded-[200px] text-[10px] font-medium bg-white/10 text-white/60 border border-white/10">
                  Friendship Seeker
                </span>
              )}
            </div>
          </div>

          {/* Bottom Card Footer */}
          <div className="relative z-10 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-white/70">
            <div className="flex items-center gap-1">
              <Calendar
                className="w-3 h-3"
                style={{ color: isCustom ? customColor : '#fbbf24' }}
              />
              <span>Friends since {formattedDate}</span>
            </div>

            <div className="flex items-center gap-1 text-white/50 group-hover:text-white/90 transition-colors">
              <RotateCw className="w-3 h-3" />
              <span>Flip</span>
            </div>
          </div>
        </div>

        {/* ================= BACK SIDE ================= */}
        <div
          className={`absolute inset-0 w-full h-full rounded-[50px] ${!isCustom ? `bg-gradient-to-b ${theme.bgGradient} border-[2.6px] ${theme.borderColor}` : ''} p-4 flex flex-col justify-between overflow-hidden rotate-y-180 backface-hidden shadow-2xl`}
          style={customCardFrontBackStyle}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/15">
            <div className="flex items-center gap-1.5">
              <Shield
                className="w-4 h-4"
                style={{ color: isCustom ? customColor : '#fbbf24' }}
              />
              <span className="font-bold text-xs text-white tracking-wider uppercase">
                Friendship Lore
              </span>
            </div>
            <span className="text-[10px] font-mono text-white/60">{cardData.tcgId}</span>
          </div>

          {/* Friendship Stats & Milestones */}
          <div className="my-auto space-y-3">
            {/* Bio */}
            {cardData.bio && (
              <div className="p-3 rounded-[50px] bg-black/40 border border-white/10 px-4">
                <p className="text-[11px] text-white/85 line-clamp-3 leading-relaxed">
                  {cardData.bio}
                </p>
              </div>
            )}

            {/* Location & Activities */}
            <div className="space-y-1.5 text-[11px]">
              {cardData.locationArea && (
                <div className="flex items-center gap-1.5 text-white/80">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{cardData.locationArea}</span>
                </div>
              )}
              {cardData.favoriteActivities && cardData.favoriteActivities.length > 0 && (
                <div className="flex items-center gap-1.5 text-white/80">
                  <Heart className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span className="truncate">
                    Loves: {cardData.favoriteActivities.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Milestones Achieved */}
            <div className="p-3 rounded-[50px] bg-white/5 border border-white/10 space-y-1.5 px-4">
              <div
                className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: isCustom ? customColor : '#fcd34d' }}
              >
                <Award className="w-3 h-3" />
                <span>Friendship Milestones</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <div className="flex items-center gap-1 text-emerald-400">
                  <span>✓</span> Friendship Bonded
                </div>
                <div
                  className="flex items-center gap-1"
                  style={{ color: isCustom ? customColor : '#fcd34d' }}
                >
                  <span>🔥</span> {cardData.streakDays || 1}-Day Streak
                </div>
                {cardData.milestones?.includes('first_chat') && (
                  <div className="flex items-center gap-1 text-cyan-400">
                    <span>✓</span> First Chat
                  </div>
                )}
                {cardData.milestones?.includes('first_call') && (
                  <div className="flex items-center gap-1 text-purple-400">
                    <span>✓</span> First Call
                  </div>
                )}
                {cardData.milestones?.includes('first_activity') && (
                  <div className="flex items-center gap-1 text-rose-400">
                    <span>✓</span> Played Activity
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-white/60">
            <span
              className="font-extrabold tracking-wider"
              style={{ color: isCustom ? customColor : '#fbbf24' }}
            >
              1 CARD = 1 POINT
            </span>
            <div className="flex items-center gap-1 text-white/40 group-hover:text-white/80 transition-colors">
              <RotateCw className="w-3 h-3" />
              <span>Flip back</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
