import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  UserPublicProfile,
  Friendship,
  FriendRequest,
  TCGCard,
  Message,
  NotificationItem,
  CardSnapshot,
  LeaderboardEntry,
  CardTheme,
} from '../types/tcg';

interface DatabaseSchema {
  users: Record<string, User & { passwordHash: string; salt: string }>;
  friendships: Record<string, Friendship>;
  friendRequests: Record<string, FriendRequest>;
  cards: Record<string, TCGCard>;
  messages: Record<string, Message>;
  notifications: Record<string, NotificationItem>;
  dailyRecommendations: Record<string, { date: string; recommendations: any[] }>; // key: `${userId}_${dateStr}`
  blockedUsers: Record<string, { id: string; userId: string; blockedUserId: string; createdAt: string }>;
  reports: Record<string, { id: string; reporterId: string; reportedUserId: string; reason: string; createdAt: string }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'tcg_friends.json');

class DatabaseService {
  private data: DatabaseSchema = {
    users: {},
    friendships: {},
    friendRequests: {},
    cards: {},
    messages: {},
    notifications: {},
    dailyRecommendations: {},
    blockedUsers: {},
    reports: {},
  };

  private listeners: Map<string, (event: { type: string; payload: any }) => void> = new Map();

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users || {},
          friendships: parsed.friendships || {},
          friendRequests: parsed.friendRequests || {},
          cards: parsed.cards || {},
          messages: parsed.messages || {},
          notifications: parsed.notifications || {},
          dailyRecommendations: parsed.dailyRecommendations || {},
          blockedUsers: parsed.blockedUsers || {},
          reports: parsed.reports || {},
        };

        // Filter out any previous demo users if present
        const demoUserIds = ['usr_alex_001', 'usr_sarah_002', 'usr_marcus_003', 'usr_elena_004', 'usr_kai_005', 'usr_maya_006'];
        let hasDemoUsers = false;
        demoUserIds.forEach((id) => {
          if (this.data.users[id]) {
            delete this.data.users[id];
            hasDemoUsers = true;
          }
        });
        if (hasDemoUsers) {
          // Clean up cards, friendships, messages associated with demo users
          Object.keys(this.data.cards).forEach((k) => {
            if (demoUserIds.includes(this.data.cards[k].originalUserId) || demoUserIds.includes(this.data.cards[k].ownerId)) {
              delete this.data.cards[k];
            }
          });
          Object.keys(this.data.friendships).forEach((k) => {
            if (demoUserIds.includes(this.data.friendships[k].user1Id) || demoUserIds.includes(this.data.friendships[k].user2Id)) {
              delete this.data.friendships[k];
            }
          });
          Object.keys(this.data.friendRequests).forEach((k) => {
            if (demoUserIds.includes(this.data.friendRequests[k].senderId) || demoUserIds.includes(this.data.friendRequests[k].receiverId)) {
              delete this.data.friendRequests[k];
            }
          });
          Object.keys(this.data.messages).forEach((k) => {
            if (demoUserIds.includes(this.data.messages[k].senderId) || demoUserIds.includes(this.data.messages[k].receiverId)) {
              delete this.data.messages[k];
            }
          });
          this.save();
        }
      }
    } catch (e) {
      console.error('Error loading database:', e);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database:', e);
    }
  }

  public subscribe(id: string, listener: (event: { type: string; payload: any }) => void) {
    this.listeners.set(id, listener);
    return () => {
      this.listeners.delete(id);
    };
  }

  public broadcast(targetUserId: string | null, type: string, payload: any) {
    for (const [clientId, listener] of this.listeners.entries()) {
      if (!targetUserId || clientId.startsWith(targetUserId)) {
        listener({ type, payload });
      }
    }
  }

  // --- Auth & Users ---
  public generateTCGId(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const digits = '23456789';
    let result = 'TCG-';
    for (let i = 0; i < 3; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 5; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    // ensure uniqueness
    const exists = Object.values(this.data.users).some((u) => u.tcgId === result);
    if (exists) {
      return this.generateTCGId();
    }
    return result;
  }

  public hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  public createUser(params: {
    email: string;
    password: string;
    name: string;
    age: number;
    avatarUrl?: string;
    bio?: string;
    hobbies?: string[];
    interests?: string[];
    favoriteActivities?: string[];
    locationArea?: string;
  }): User {
    const existing = Object.values(this.data.users).find(
      (u) => u.email.toLowerCase() === params.email.toLowerCase()
    );
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const id = 'usr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(params.password, salt);
    const tcgId = this.generateTCGId();

    const userRecord: User & { passwordHash: string; salt: string } = {
      id,
      email: params.email.toLowerCase(),
      passwordHash,
      salt,
      name: params.name || 'New Collector',
      age: params.age || 18,
      tcgId,
      avatarUrl:
        params.avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(tcgId)}`,
      bio: params.bio || '',
      hobbies: params.hobbies || [],
      interests: params.interests || [],
      favoriteActivities: params.favoriteActivities || [],
      locationArea: params.locationArea || '',
      availability: [
        { id: 'slot_1', day: 'Saturday', timeRange: '2 PM – 6 PM' },
        { id: 'slot_2', day: 'Sunday', timeRange: '10 AM – 2 PM' },
      ],
      availabilityPrivacy: 'everyone',
      cardTheme: 'holographic_gold',
      customQuote: 'Always ready to collect new friendships!',
      unlockedFrames: ['standard_legendary'],
      equippedFrame: 'standard_legendary',
      unlockedTitles: ['Collector'],
      equippedTitle: 'Collector',
      onlineStatus: 'online',
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      hasCompletedTutorial: false,
    };

    this.data.users[id] = userRecord;
    this.save();
    return this.sanitizeUser(userRecord);
  }

  public verifyUser(email: string, password: string): User | null {
    const user = Object.values(this.data.users).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) return null;
    const computed = this.hashPassword(password, user.salt);
    if (computed !== user.passwordHash) return null;

    user.onlineStatus = 'online';
    user.lastActiveAt = new Date().toISOString();
    this.save();
    return this.sanitizeUser(user);
  }

  public resetPassword(email: string, newPassword: string): boolean {
    const user = Object.values(this.data.users).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) return false;
    const salt = crypto.randomBytes(16).toString('hex');
    user.salt = salt;
    user.passwordHash = this.hashPassword(newPassword, salt);
    this.save();
    return true;
  }

  public getUserById(id: string): User | null {
    const u = this.data.users[id];
    return u ? this.sanitizeUser(u) : null;
  }

  public getUserByTCGId(tcgId: string): UserPublicProfile | null {
    const cleanId = tcgId.trim().toUpperCase();
    const user = Object.values(this.data.users).find(
      (u) => u.tcgId.toUpperCase() === cleanId || u.tcgId.replace(/-/g, '').toUpperCase() === cleanId.replace(/-/g, '')
    );
    if (!user) return null;
    return this.toPublicProfile(user);
  }

  public updateUser(
    id: string,
    updates: Partial<Omit<User, 'id' | 'email' | 'tcgId' | 'createdAt'>>
  ): User {
    const user = this.data.users[id];
    if (!user) throw new Error('User not found');

    Object.assign(user, updates);
    user.lastActiveAt = new Date().toISOString();
    this.save();

    // Update existing snapshots on cards if friend updated their avatar/theme/quote
    Object.values(this.data.cards).forEach((c) => {
      if (c.originalUserId === id) {
        c.cardData.name = user.name;
        c.cardData.avatarUrl = user.avatarUrl;
        c.cardData.bio = user.bio;
        c.cardData.hobbies = user.hobbies;
        c.cardData.interests = user.interests;
        c.cardData.favoriteActivities = user.favoriteActivities;
        c.cardData.locationArea = user.locationArea;
        c.cardData.cardTheme = user.cardTheme;
        c.cardData.customCardColor = user.customCardColor;
        c.cardData.customQuote = user.customQuote;
      }
    });
    this.save();

    return this.sanitizeUser(user);
  }

  public setOnlineStatus(id: string, status: 'online' | 'recently_active' | 'offline') {
    const user = this.data.users[id];
    if (user) {
      user.onlineStatus = status;
      user.lastActiveAt = new Date().toISOString();
      this.save();
      this.broadcast(null, 'user_presence', { userId: id, status });
    }
  }

  public sanitizeUser(user: User & { passwordHash?: string; salt?: string }): User {
    const copy = { ...user };
    delete copy.passwordHash;
    delete copy.salt;
    return copy;
  }

  public toPublicProfile(user: User, currentUserId?: string): UserPublicProfile {
    const cardsCount = Object.values(this.data.cards).filter(
      (c) => c.ownerId === user.id
    ).length;

    let isFriend = false;
    let streakWithMe = 0;
    let hasPendingRequest = false;

    if (currentUserId && currentUserId !== user.id) {
      const friendship = this.findFriendship(currentUserId, user.id);
      if (friendship) {
        isFriend = true;
        streakWithMe = friendship.streakDays;
      } else {
        const req = Object.values(this.data.friendRequests).find(
          (r) =>
            r.status === 'pending' &&
            ((r.senderId === currentUserId && r.receiverId === user.id) ||
              (r.senderId === user.id && r.receiverId === currentUserId))
        );
        if (req) {
          hasPendingRequest = true;
        }
      }
    }

    const showAvailability =
      user.availabilityPrivacy === 'everyone' ||
      (user.availabilityPrivacy === 'friends' && isFriend) ||
      user.id === currentUserId;

    return {
      id: user.id,
      name: user.name,
      age: user.age,
      tcgId: user.tcgId,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      hobbies: user.hobbies,
      interests: user.interests,
      favoriteActivities: user.favoriteActivities,
      locationArea: user.locationArea,
      availability: showAvailability ? user.availability : undefined,
      cardTheme: user.cardTheme,
      customCardColor: user.customCardColor,
      customQuote: user.customQuote,
      equippedFrame: user.equippedFrame,
      equippedTitle: user.equippedTitle,
      onlineStatus: user.onlineStatus,
      cardsCount,
      streakWithMe,
      isFriend,
      hasPendingRequest,
    };
  }

  // --- Friendships & Requests ---
  public findFriendship(user1Id: string, user2Id: string): Friendship | null {
    return (
      Object.values(this.data.friendships).find(
        (f) =>
          (f.user1Id === user1Id && f.user2Id === user2Id) ||
          (f.user1Id === user2Id && f.user2Id === user1Id)
      ) || null
    );
  }

  public getFriendsForUser(userId: string): { friendship: Friendship; friend: UserPublicProfile }[] {
    const results: { friendship: Friendship; friend: UserPublicProfile }[] = [];
    const friendships = Object.values(this.data.friendships).filter(
      (f) => f.user1Id === userId || f.user2Id === userId
    );

    for (const f of friendships) {
      const friendId = f.user1Id === userId ? f.user2Id : f.user1Id;
      const friendUser = this.data.users[friendId];
      if (friendUser) {
        results.push({
          friendship: f,
          friend: this.toPublicProfile(friendUser, userId),
        });
      }
    }
    return results;
  }

  public sendFriendRequest(senderId: string, receiverId: string): FriendRequest {
    if (senderId === receiverId) {
      throw new Error('You cannot add yourself as a friend.');
    }
    const sender = this.data.users[senderId];
    const receiver = this.data.users[receiverId];
    if (!sender || !receiver) throw new Error('User not found.');

    // Check if blocked
    const isBlocked = Object.values(this.data.blockedUsers).some(
      (b) =>
        (b.userId === senderId && b.blockedUserId === receiverId) ||
        (b.userId === receiverId && b.blockedUserId === senderId)
    );
    if (isBlocked) throw new Error('Cannot send friend request to this user.');

    // Check if already friends
    if (this.findFriendship(senderId, receiverId)) {
      throw new Error('You are already friends with this user!');
    }

    // Check if pending request exists
    const existingReq = Object.values(this.data.friendRequests).find(
      (r) =>
        r.status === 'pending' &&
        ((r.senderId === senderId && r.receiverId === receiverId) ||
          (r.senderId === receiverId && r.receiverId === senderId))
    );

    if (existingReq) {
      if (existingReq.senderId === receiverId) {
        // Mutual request -> automatically accept!
        return this.acceptFriendRequest(existingReq.id, senderId);
      }
      throw new Error('Friend request already pending.');
    }

    const id = 'req_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const req: FriendRequest = {
      id,
      senderId,
      receiverId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.data.friendRequests[id] = req;

    // Send notification to receiver
    this.createNotification({
      userId: receiverId,
      type: 'friend_request',
      title: '👥 New Friend Request',
      body: `${sender.name} (${sender.tcgId}) sent you a friend request!`,
      data: { requestId: id, senderId, senderName: sender.name, senderTcgId: sender.tcgId },
    });

    this.save();
    this.broadcast(receiverId, 'friend_request_received', { request: req });
    return req;
  }

  public acceptFriendRequest(requestId: string, currentUserId: string): FriendRequest {
    const req = this.data.friendRequests[requestId];
    if (!req) throw new Error('Friend request not found.');
    if (req.receiverId !== currentUserId && req.senderId !== currentUserId) {
      throw new Error('Unauthorized');
    }
    if (req.status !== 'pending') {
      throw new Error('Request is no longer pending.');
    }

    req.status = 'accepted';

    const user1 = this.data.users[req.senderId];
    const user2 = this.data.users[req.receiverId];

    if (!user1 || !user2) throw new Error('Users not found');

    // Create Friendship
    let friendship = this.findFriendship(req.senderId, req.receiverId);
    if (!friendship) {
      const friendshipId = 'fr_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      friendship = {
        id: friendshipId,
        user1Id: req.senderId,
        user2Id: req.receiverId,
        createdAt: new Date().toISOString(),
        streakDays: 1,
        lastInteractionAt: new Date().toISOString(),
        lastInteractionDateStr: new Date().toISOString().split('T')[0],
        milestones: ['friendship_started', 'card_collected'],
        activitiesCompleted: 0,
      };
      this.data.friendships[friendshipId] = friendship;
    }

    // Award Legendary Cards to both users (strictly 1 card per unique friend!)
    const card1 = this.mintLegendaryCard(req.senderId, user2, friendship.id);
    const card2 = this.mintLegendaryCard(req.receiverId, user1, friendship.id);

    // Update achievement titles if eligible
    this.checkAndAwardAchievements(req.senderId);
    this.checkAndAwardAchievements(req.receiverId);

    // Notifications
    this.createNotification({
      userId: req.senderId,
      type: 'card_unlocked',
      title: '🎴 Legendary Card Unlocked!',
      body: `You became friends with ${user2.name}! Their Legendary Card has been added to your collection.`,
      data: { card: card1, friendId: user2.id, friendName: user2.name },
    });

    this.createNotification({
      userId: req.receiverId,
      type: 'card_unlocked',
      title: '🎴 Legendary Card Unlocked!',
      body: `You became friends with ${user1.name}! Their Legendary Card has been added to your collection.`,
      data: { card: card2, friendId: user1.id, friendName: user1.name },
    });

    this.save();

    // Realtime events
    this.broadcast(req.senderId, 'friendship_accepted', { friendship, newCard: card1, friend: this.toPublicProfile(user2, req.senderId) });
    this.broadcast(req.receiverId, 'friendship_accepted', { friendship, newCard: card2, friend: this.toPublicProfile(user1, req.receiverId) });

    return req;
  }

  public declineFriendRequest(requestId: string, currentUserId: string): FriendRequest {
    const req = this.data.friendRequests[requestId];
    if (!req) throw new Error('Friend request not found.');
    if (req.receiverId !== currentUserId) throw new Error('Unauthorized');

    req.status = 'declined';
    this.save();
    this.broadcast(req.senderId, 'friend_request_declined', { requestId });
    return req;
  }

  public removeFriendship(friendshipId: string, currentUserId: string): boolean {
    const f = this.data.friendships[friendshipId];
    if (!f) return false;
    if (f.user1Id !== currentUserId && f.user2Id !== currentUserId) return false;

    delete this.data.friendships[friendshipId];
    this.save();

    const otherId = f.user1Id === currentUserId ? f.user2Id : f.user1Id;
    this.broadcast(otherId, 'friendship_removed', { friendshipId });
    return true;
  }

  // --- Cards & Collection ---
  private mintLegendaryCard(ownerId: string, friend: User, friendshipId: string): TCGCard {
    // Check if card already exists for this unique user (Anti-cheating rule)
    const existing = Object.values(this.data.cards).find(
      (c) => c.ownerId === ownerId && c.originalUserId === friend.id
    );
    if (existing) {
      return existing;
    }

    const cardId = 'crd_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const cardData: CardSnapshot = {
      name: friend.name,
      age: friend.age,
      tcgId: friend.tcgId,
      avatarUrl: friend.avatarUrl,
      bio: friend.bio,
      hobbies: friend.hobbies,
      interests: friend.interests,
      favoriteActivities: friend.favoriteActivities,
      locationArea: friend.locationArea,
      cardTheme: friend.cardTheme,
      customCardColor: friend.customCardColor,
      customQuote: friend.customQuote || 'Legendary Friend',
      equippedFrame: friend.equippedFrame,
      friendshipDate: new Date().toISOString(),
      streakDays: 1,
      milestones: ['friendship_started'],
    };

    const card: TCGCard = {
      id: cardId,
      ownerId,
      originalUserId: friend.id,
      friendshipId,
      collectedAt: new Date().toISOString(),
      cardData,
    };

    this.data.cards[cardId] = card;
    return card;
  }

  public getCardsForUser(userId: string): TCGCard[] {
    return Object.values(this.data.cards)
      .filter((c) => c.ownerId === userId)
      .sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime());
  }

  private checkAndAwardAchievements(userId: string) {
    const user = this.data.users[userId];
    if (!user) return;
    const cardCount = Object.values(this.data.cards).filter((c) => c.ownerId === userId).length;

    const milestones = [
      { count: 10, title: 'Collector', frame: 'frame_collector' },
      { count: 25, title: 'Social Collector', frame: 'frame_social' },
      { count: 50, title: 'Master Collector', frame: 'frame_master' },
      { count: 100, title: 'Elite Collector', frame: 'frame_elite' },
      { count: 250, title: 'TCG Legend', frame: 'frame_legend' },
      { count: 500, title: 'TCG Icon', frame: 'frame_icon' },
    ];

    let unlockedAny = false;
    milestones.forEach((m) => {
      if (cardCount >= m.count) {
        if (!user.unlockedTitles.includes(m.title)) {
          user.unlockedTitles.push(m.title);
          unlockedAny = true;
        }
        if (!user.unlockedFrames.includes(m.frame)) {
          user.unlockedFrames.push(m.frame);
          unlockedAny = true;
        }
      }
    });

    if (unlockedAny) {
      this.createNotification({
        userId,
        type: 'streak_milestone',
        title: '🏆 Achievement Unlocked!',
        body: `You unlocked new cosmetic rewards for collecting ${cardCount} cards!`,
      });
    }
  }

  // --- Leaderboards (Global, Monthly, Weekly) ---
  public getLeaderboard(period: 'global' | 'monthly' | 'weekly', currentUserId?: string): {
    leaderboard: LeaderboardEntry[];
    currentUserRank?: LeaderboardEntry;
    totalRegistered: number;
  } {
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const users = Object.values(this.data.users);

    const entries: LeaderboardEntry[] = users.map((u) => {
      const allCards = Object.values(this.data.cards).filter((c) => c.ownerId === u.id);
      const totalCount = allCards.length;

      const weeklyCards = allCards.filter((c) => new Date(c.collectedAt) >= currentWeekStart);
      const monthlyCards = allCards.filter((c) => new Date(c.collectedAt) >= currentMonthStart);

      let sortScore = totalCount;
      if (period === 'weekly') {
        sortScore = weeklyCards.length;
      } else if (period === 'monthly') {
        sortScore = monthlyCards.length;
      }

      return {
        rank: 0,
        userId: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        tcgId: u.tcgId,
        cardCount: period === 'global' ? totalCount : sortScore,
        weeklyGain: weeklyCards.length,
        monthlyGain: monthlyCards.length,
        equippedTitle: u.equippedTitle,
        equippedFrame: u.equippedFrame,
        cardTheme: u.cardTheme,
        customCardColor: u.customCardColor,
        isCurrentUser: u.id === currentUserId,
      };
    });

    // Sort descending by card count, then by user creation date
    entries.sort((a, b) => b.cardCount - a.cardCount);

    // Assign 1-indexed ranks
    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    const currentUserRank = currentUserId ? entries.find((e) => e.userId === currentUserId) : undefined;

    return {
      leaderboard: entries,
      currentUserRank,
      totalRegistered: users.length,
    };
  }

  // --- Real-Time Messages ---
  public sendMessage(params: {
    senderId: string;
    receiverId: string;
    content: string;
    type?: 'text' | 'voice' | 'activity_prompt' | 'call_log';
    audioDataUrl?: string;
    audioDurationSeconds?: number;
  }): Message {
    const { senderId, receiverId, content, type = 'text', audioDataUrl, audioDurationSeconds } = params;

    const sender = this.data.users[senderId];
    if (!sender) throw new Error('Sender not found');

    const msgId = 'msg_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const msg: Message = {
      id: msgId,
      senderId,
      receiverId,
      content,
      type,
      audioDataUrl,
      audioDurationSeconds,
      createdAt: new Date().toISOString(),
    };

    this.data.messages[msgId] = msg;

    // Maintain friendship streak & record interaction
    this.recordInteraction(senderId, receiverId, 'chat');

    // Create notification
    this.createNotification({
      userId: receiverId,
      type: 'message',
      title: `💬 ${sender.name}`,
      body: type === 'voice' ? '🎙️ Sent you a voice message' : content.length > 50 ? content.slice(0, 47) + '...' : content,
      data: { messageId: msgId, senderId, senderName: sender.name },
    });

    this.save();

    // Broadcast to both parties
    this.broadcast(receiverId, 'new_message', { message: msg });
    this.broadcast(senderId, 'new_message', { message: msg });

    return msg;
  }

  public getMessages(user1Id: string, user2Id: string): Message[] {
    return Object.values(this.data.messages)
      .filter(
        (m) =>
          (m.senderId === user1Id && m.receiverId === user2Id) ||
          (m.senderId === user2Id && m.receiverId === user1Id)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public markMessagesAsRead(currentUserId: string, friendId: string) {
    const unread = Object.values(this.data.messages).filter(
      (m) => m.senderId === friendId && m.receiverId === currentUserId && !m.readAt
    );
    const now = new Date().toISOString();
    unread.forEach((m) => {
      m.readAt = now;
    });
    if (unread.length > 0) {
      this.save();
      this.broadcast(friendId, 'messages_read', { readBy: currentUserId, friendId });
    }
  }

  // --- Interaction Streaks & Milestones ---
  public recordInteraction(user1Id: string, user2Id: string, actionType: 'chat' | 'call' | 'activity') {
    const f = this.findFriendship(user1Id, user2Id);
    if (!f) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastStr = f.lastInteractionDateStr;

    f.lastInteractionAt = new Date().toISOString();

    if (actionType === 'chat' && !f.milestones.includes('first_chat')) {
      f.milestones.push('first_chat');
    }
    if (actionType === 'call' && !f.milestones.includes('first_call')) {
      f.milestones.push('first_call');
    }
    if (actionType === 'activity') {
      f.activitiesCompleted = (f.activitiesCompleted || 0) + 1;
      if (!f.milestones.includes('first_activity')) {
        f.milestones.push('first_activity');
      }
    }

    if (lastStr !== todayStr) {
      // Check if consecutive day
      if (lastStr) {
        const lastDate = new Date(lastStr);
        const todayDate = new Date(todayStr);
        const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          f.streakDays += 1;
        } else if (diffDays > 2) {
          // Missed more than a day
          f.streakDays = 1;
        }
      } else {
        f.streakDays = 1;
      }
      f.lastInteractionDateStr = todayStr;

      // Check streak milestones
      if (f.streakDays >= 7 && !f.milestones.includes('streak_7')) {
        f.milestones.push('streak_7');
        this.createNotification({
          userId: user1Id,
          type: 'streak_milestone',
          title: '🔥 7-Day Streak!',
          body: `You and your friend reached a 7-day friendship streak!`,
        });
        this.createNotification({
          userId: user2Id,
          type: 'streak_milestone',
          title: '🔥 7-Day Streak!',
          body: `You and your friend reached a 7-day friendship streak!`,
        });
      }
      if (f.streakDays >= 30 && !f.milestones.includes('streak_30')) {
        f.milestones.push('streak_30');
      }
      if (f.streakDays >= 100 && !f.milestones.includes('streak_100')) {
        f.milestones.push('streak_100');
      }

      // Sync streak to cards
      Object.values(this.data.cards).forEach((c) => {
        if (
          (c.ownerId === user1Id && c.originalUserId === user2Id) ||
          (c.ownerId === user2Id && c.originalUserId === user1Id)
        ) {
          c.cardData.streakDays = f.streakDays;
          c.cardData.milestones = f.milestones;
        }
      });
    }

    this.save();
  }

  // --- Notifications ---
  public createNotification(params: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>): NotificationItem {
    const id = 'notif_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const notif: NotificationItem = {
      id,
      ...params,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications[id] = notif;
    this.save();
    this.broadcast(params.userId, 'new_notification', { notification: notif });
    return notif;
  }

  public getNotifications(userId: string): NotificationItem[] {
    return Object.values(this.data.notifications)
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public markNotificationAsRead(id: string, userId: string) {
    const n = this.data.notifications[id];
    if (n && n.userId === userId) {
      n.read = true;
      this.save();
    }
  }

  public clearAllNotifications(userId: string) {
    Object.values(this.data.notifications).forEach((n) => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    this.save();
  }

  // --- Safety & Moderation ---
  public blockUser(userId: string, blockedUserId: string) {
    const id = `blk_${userId}_${blockedUserId}`;
    this.data.blockedUsers[id] = {
      id,
      userId,
      blockedUserId,
      createdAt: new Date().toISOString(),
    };
    this.save();
  }

  public unblockUser(userId: string, blockedUserId: string) {
    const id = `blk_${userId}_${blockedUserId}`;
    delete this.data.blockedUsers[id];
    this.save();
  }

  public getBlockedUsers(userId: string): string[] {
    return Object.values(this.data.blockedUsers)
      .filter((b) => b.userId === userId)
      .map((b) => b.blockedUserId);
  }

  public reportUser(reporterId: string, reportedUserId: string, reason: string) {
    const id = 'rep_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    this.data.reports[id] = {
      id,
      reporterId,
      reportedUserId,
      reason,
      createdAt: new Date().toISOString(),
    };
    this.save();
  }

  // --- Recommendations storage ---
  public getStoredRecommendations(userId: string, dateStr: string) {
    return this.data.dailyRecommendations[`${userId}_${dateStr}`];
  }

  public storeDailyRecommendations(userId: string, dateStr: string, recommendations: any[]) {
    this.data.dailyRecommendations[`${userId}_${dateStr}`] = {
      date: dateStr,
      recommendations,
    };
    this.save();
  }

  public getAllRegisteredUsers(): User[] {
    return Object.values(this.data.users).map((u) => this.sanitizeUser(u));
  }
}

export const db = new DatabaseService();
