export type CardTheme = 
  | 'holographic_gold'
  | 'neon_cyber'
  | 'cosmic_void'
  | 'emerald_nature'
  | 'inferno_red'
  | 'aurora_borealis'
  | 'amethyst_arcane'
  | 'obsidian_chrome'
  | 'custom';

export interface AvailabilitySlot {
  id: string;
  day: string; // e.g. 'Monday', 'Saturday', 'Weekends'
  timeRange: string; // e.g. '2 PM – 6 PM'
}

export type AvailabilityPrivacy = 'everyone' | 'friends' | 'nobody';

export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  tcgId: string; // e.g. "CAL82491"
  avatarUrl: string;
  bio: string;
  hobbies: string[];
  interests: string[];
  favoriteActivities: string[];
  locationArea: string;
  availability: AvailabilitySlot[];
  availabilityPrivacy: AvailabilityPrivacy;
  cardTheme: CardTheme;
  customCardColor?: string; // Hex color from browser color wheel e.g. '#ff0055'
  customQuote: string;
  unlockedFrames: string[];
  equippedFrame?: string;
  unlockedTitles: string[];
  equippedTitle?: string;
  onlineStatus: 'online' | 'recently_active' | 'offline';
  lastActiveAt: string;
  createdAt: string;
  hasCompletedTutorial: boolean;
}

export interface UserPublicProfile {
  id: string;
  name: string;
  age: number;
  tcgId: string;
  avatarUrl: string;
  bio: string;
  hobbies: string[];
  interests: string[];
  favoriteActivities: string[];
  locationArea: string;
  availability?: AvailabilitySlot[];
  cardTheme: CardTheme;
  customCardColor?: string;
  customQuote: string;
  equippedFrame?: string;
  equippedTitle?: string;
  onlineStatus: 'online' | 'recently_active' | 'offline';
  cardsCount: number;
  streakWithMe?: number;
  isFriend?: boolean;
  hasPendingRequest?: boolean;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
  streakDays: number;
  lastInteractionAt: string;
  lastInteractionDateStr?: string;
  milestones: string[]; // e.g. 'first_chat', 'first_call', 'streak_7', 'streak_30', 'streak_100', 'first_activity'
  activitiesCompleted: number;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  senderProfile?: UserPublicProfile;
  receiverProfile?: UserPublicProfile;
}

export interface CardSnapshot {
  name: string;
  age: number;
  tcgId: string;
  avatarUrl: string;
  bio: string;
  hobbies: string[];
  interests: string[];
  favoriteActivities: string[];
  locationArea: string;
  cardTheme: CardTheme;
  customCardColor?: string;
  customQuote: string;
  equippedFrame?: string;
  friendshipDate: string;
  streakDays: number;
  milestones: string[];
}

export interface TCGCard {
  id: string;
  ownerId: string; // The user who collected this card
  originalUserId: string; // The friend who is represented on the card
  friendshipId: string;
  collectedAt: string;
  cardData: CardSnapshot;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'activity_prompt' | 'call_log' | 'minigame_challenge' | 'minigame_result';
  minigameId?: string;
  minigameType?: string;
  score?: number;
  createdAt: string;
  readAt?: string;
}

export interface BlockedUserRecord {
  id: string;
  userId: string;
  blockedUserId: string;
  blockedProfile?: UserPublicProfile;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  details?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'friend_request' | 'friend_accept' | 'card_unlocked' | 'message' | 'streak_milestone' | 'call_missed';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface DailyMatchRecommendation {
  user: UserPublicProfile;
  compatibilityScore: number;
  whyYouMightGetAlong: string;
  sharedInterests: string[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string;
  tcgId: string;
  cardCount: number; // 1 friend = 1 card = 1 point
  weeklyGain?: number;
  monthlyGain?: number;
  equippedTitle?: string;
  equippedFrame?: string;
  cardTheme: CardTheme;
  customCardColor?: string;
  isCurrentUser?: boolean;
}

export interface WebRTCSignalingMessage {
  callId: string;
  callerId: string;
  receiverId: string;
  callerName: string;
  callerAvatar: string;
  callType: 'audio' | 'video';
  type: 'offer' | 'answer' | 'ice-candidate' | 'end' | 'ringing' | 'declined' | 'busy';
  sdp?: any;
  candidate?: any;
}
