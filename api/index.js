// src/server/vercel-entry.ts
import express2 from "express";
import dotenv from "dotenv";

// src/server/api.ts
import express from "express";

// src/server/db.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";
var isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
var DATA_DIR = isServerless ? "/tmp" : path.resolve(process.cwd(), "data");
var DB_FILE = path.resolve(DATA_DIR, "tcg_friends.json");
var DatabaseService = class {
  constructor() {
    this.data = {
      users: {},
      friendships: {},
      friendRequests: {},
      cards: {},
      messages: {},
      notifications: {},
      dailyRecommendations: {},
      blockedUsers: {},
      reports: {}
    };
    this.listeners = /* @__PURE__ */ new Map();
    this.load();
  }
  load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        try {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        } catch {
        }
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        if (raw && raw.trim().length > 0) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            this.data = {
              users: parsed.users || {},
              friendships: parsed.friendships || {},
              friendRequests: parsed.friendRequests || {},
              cards: parsed.cards || {},
              messages: parsed.messages || {},
              notifications: parsed.notifications || {},
              dailyRecommendations: parsed.dailyRecommendations || {},
              blockedUsers: parsed.blockedUsers || {},
              reports: parsed.reports || {}
            };
          }
        }
      }
    } catch (e) {
      console.error("Error loading database:", e);
    }
  }
  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        try {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        } catch {
        }
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Error saving database:", e);
    }
  }
  subscribe(id, listener) {
    this.listeners.set(id, listener);
    return () => {
      this.listeners.delete(id);
    };
  }
  broadcast(targetUserId, type, payload) {
    for (const [clientId, listener] of this.listeners.entries()) {
      if (!targetUserId || clientId.startsWith(targetUserId)) {
        listener({ type, payload });
      }
    }
  }
  // --- Auth & Users ---
  generateTCGId() {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const digits = "23456789";
    let result = "TCG-";
    for (let i = 0; i < 3; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    for (let i = 0; i < 5; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    const exists = Object.values(this.data.users).some((u) => u.tcgId === result);
    if (exists) {
      return this.generateTCGId();
    }
    return result;
  }
  hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 1e3, 64, "sha512").toString("hex");
  }
  createUser(params) {
    const existing = Object.values(this.data.users).find(
      (u) => u.email.toLowerCase() === params.email.toLowerCase()
    );
    if (existing) {
      throw new Error("An account with this email already exists.");
    }
    const id = "usr_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = this.hashPassword(params.password, salt);
    const tcgId = this.generateTCGId();
    const userRecord = {
      id,
      email: params.email.toLowerCase(),
      passwordHash,
      salt,
      name: params.name || "New Collector",
      age: params.age || 18,
      tcgId,
      avatarUrl: params.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(tcgId)}`,
      bio: params.bio || "",
      hobbies: params.hobbies || [],
      interests: params.interests || [],
      favoriteActivities: params.favoriteActivities || [],
      locationArea: params.locationArea || "",
      availability: [
        { id: "slot_1", day: "Saturday", timeRange: "2 PM \u2013 6 PM" },
        { id: "slot_2", day: "Sunday", timeRange: "10 AM \u2013 2 PM" }
      ],
      availabilityPrivacy: "everyone",
      cardTheme: "holographic_gold",
      customQuote: "Always ready to collect new friendships!",
      unlockedFrames: ["standard_legendary"],
      equippedFrame: "standard_legendary",
      unlockedTitles: ["Collector"],
      equippedTitle: "Collector",
      onlineStatus: "online",
      lastActiveAt: (/* @__PURE__ */ new Date()).toISOString(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      hasCompletedTutorial: false
    };
    this.data.users[id] = userRecord;
    this.save();
    return this.sanitizeUser(userRecord);
  }
  verifyUser(email, password) {
    const user = Object.values(this.data.users).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) return null;
    const computed = this.hashPassword(password, user.salt);
    if (computed !== user.passwordHash) return null;
    user.onlineStatus = "online";
    user.lastActiveAt = (/* @__PURE__ */ new Date()).toISOString();
    this.save();
    return this.sanitizeUser(user);
  }
  resetPassword(email, newPassword) {
    const user = Object.values(this.data.users).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!user) return false;
    const salt = crypto.randomBytes(16).toString("hex");
    user.salt = salt;
    user.passwordHash = this.hashPassword(newPassword, salt);
    this.save();
    return true;
  }
  getUserById(id) {
    const u = this.data.users[id];
    return u ? this.sanitizeUser(u) : null;
  }
  getUserByTCGId(tcgId) {
    const cleanId = tcgId.trim().toUpperCase();
    const user = Object.values(this.data.users).find(
      (u) => u.tcgId.toUpperCase() === cleanId || u.tcgId.replace(/-/g, "").toUpperCase() === cleanId.replace(/-/g, "")
    );
    if (!user) return null;
    return this.toPublicProfile(user);
  }
  updateUser(id, updates) {
    const user = this.data.users[id];
    if (!user) throw new Error("User not found");
    Object.assign(user, updates);
    user.lastActiveAt = (/* @__PURE__ */ new Date()).toISOString();
    this.save();
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
  setOnlineStatus(id, status) {
    const user = this.data.users[id];
    if (user) {
      user.onlineStatus = status;
      user.lastActiveAt = (/* @__PURE__ */ new Date()).toISOString();
      this.save();
      this.broadcast(null, "user_presence", { userId: id, status });
    }
  }
  sanitizeUser(user) {
    const copy = { ...user };
    delete copy.passwordHash;
    delete copy.salt;
    return copy;
  }
  toPublicProfile(user, currentUserId) {
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
          (r) => r.status === "pending" && (r.senderId === currentUserId && r.receiverId === user.id || r.senderId === user.id && r.receiverId === currentUserId)
        );
        if (req) {
          hasPendingRequest = true;
        }
      }
    }
    const showAvailability = user.availabilityPrivacy === "everyone" || user.availabilityPrivacy === "friends" && isFriend || user.id === currentUserId;
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
      availability: showAvailability ? user.availability : void 0,
      cardTheme: user.cardTheme,
      customCardColor: user.customCardColor,
      customQuote: user.customQuote,
      equippedFrame: user.equippedFrame,
      equippedTitle: user.equippedTitle,
      onlineStatus: user.onlineStatus,
      cardsCount,
      streakWithMe,
      isFriend,
      hasPendingRequest
    };
  }
  // --- Friendships & Requests ---
  findFriendship(user1Id, user2Id) {
    return Object.values(this.data.friendships).find(
      (f) => f.user1Id === user1Id && f.user2Id === user2Id || f.user1Id === user2Id && f.user2Id === user1Id
    ) || null;
  }
  getFriendsForUser(userId) {
    const results = [];
    const friendships = Object.values(this.data.friendships).filter(
      (f) => f.user1Id === userId || f.user2Id === userId
    );
    for (const f of friendships) {
      const friendId = f.user1Id === userId ? f.user2Id : f.user1Id;
      const friendUser = this.data.users[friendId];
      if (friendUser) {
        results.push({
          friendship: f,
          friend: this.toPublicProfile(friendUser, userId)
        });
      }
    }
    return results;
  }
  sendFriendRequest(senderId, receiverId) {
    if (senderId === receiverId) {
      throw new Error("You cannot add yourself as a friend.");
    }
    const sender = this.data.users[senderId];
    const receiver = this.data.users[receiverId];
    if (!sender || !receiver) throw new Error("User not found.");
    const isBlocked = Object.values(this.data.blockedUsers).some(
      (b) => b.userId === senderId && b.blockedUserId === receiverId || b.userId === receiverId && b.blockedUserId === senderId
    );
    if (isBlocked) throw new Error("Cannot send friend request to this user.");
    if (this.findFriendship(senderId, receiverId)) {
      throw new Error("You are already friends with this user!");
    }
    const existingReq = Object.values(this.data.friendRequests).find(
      (r) => r.status === "pending" && (r.senderId === senderId && r.receiverId === receiverId || r.senderId === receiverId && r.receiverId === senderId)
    );
    if (existingReq) {
      if (existingReq.senderId === receiverId) {
        return this.acceptFriendRequest(existingReq.id, senderId);
      }
      throw new Error("Friend request already pending.");
    }
    const id = "req_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const req = {
      id,
      senderId,
      receiverId,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.friendRequests[id] = req;
    this.createNotification({
      userId: receiverId,
      type: "friend_request",
      title: "\u{1F465} New Friend Request",
      body: `${sender.name} (${sender.tcgId}) sent you a friend request!`,
      data: { requestId: id, senderId, senderName: sender.name, senderTcgId: sender.tcgId }
    });
    this.save();
    this.broadcast(receiverId, "friend_request_received", { request: req });
    return req;
  }
  acceptFriendRequest(requestId, currentUserId) {
    const req = this.data.friendRequests[requestId];
    if (!req) throw new Error("Friend request not found.");
    if (req.receiverId !== currentUserId && req.senderId !== currentUserId) {
      throw new Error("Unauthorized");
    }
    if (req.status !== "pending") {
      throw new Error("Request is no longer pending.");
    }
    req.status = "accepted";
    const user1 = this.data.users[req.senderId];
    const user2 = this.data.users[req.receiverId];
    if (!user1 || !user2) throw new Error("Users not found");
    let friendship = this.findFriendship(req.senderId, req.receiverId);
    if (!friendship) {
      const friendshipId = "fr_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
      friendship = {
        id: friendshipId,
        user1Id: req.senderId,
        user2Id: req.receiverId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        streakDays: 1,
        lastInteractionAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastInteractionDateStr: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        milestones: ["friendship_started", "card_collected"],
        activitiesCompleted: 0
      };
      this.data.friendships[friendshipId] = friendship;
    }
    const card1 = this.mintLegendaryCard(req.senderId, user2, friendship.id);
    const card2 = this.mintLegendaryCard(req.receiverId, user1, friendship.id);
    this.checkAndAwardAchievements(req.senderId);
    this.checkAndAwardAchievements(req.receiverId);
    this.createNotification({
      userId: req.senderId,
      type: "card_unlocked",
      title: "\u{1F3B4} Legendary Card Unlocked!",
      body: `You became friends with ${user2.name}! Their Legendary Card has been added to your collection.`,
      data: { card: card1, friendId: user2.id, friendName: user2.name }
    });
    this.createNotification({
      userId: req.receiverId,
      type: "card_unlocked",
      title: "\u{1F3B4} Legendary Card Unlocked!",
      body: `You became friends with ${user1.name}! Their Legendary Card has been added to your collection.`,
      data: { card: card2, friendId: user1.id, friendName: user1.name }
    });
    this.save();
    this.broadcast(req.senderId, "friendship_accepted", { friendship, newCard: card1, friend: this.toPublicProfile(user2, req.senderId) });
    this.broadcast(req.receiverId, "friendship_accepted", { friendship, newCard: card2, friend: this.toPublicProfile(user1, req.receiverId) });
    return req;
  }
  declineFriendRequest(requestId, currentUserId) {
    const req = this.data.friendRequests[requestId];
    if (!req) throw new Error("Friend request not found.");
    if (req.receiverId !== currentUserId) throw new Error("Unauthorized");
    req.status = "declined";
    this.save();
    this.broadcast(req.senderId, "friend_request_declined", { requestId });
    return req;
  }
  removeFriendship(friendshipId, currentUserId) {
    const f = this.data.friendships[friendshipId];
    if (!f) return false;
    if (f.user1Id !== currentUserId && f.user2Id !== currentUserId) return false;
    delete this.data.friendships[friendshipId];
    this.save();
    const otherId = f.user1Id === currentUserId ? f.user2Id : f.user1Id;
    this.broadcast(otherId, "friendship_removed", { friendshipId });
    return true;
  }
  // --- Cards & Collection ---
  mintLegendaryCard(ownerId, friend, friendshipId) {
    const existing = Object.values(this.data.cards).find(
      (c) => c.ownerId === ownerId && c.originalUserId === friend.id
    );
    if (existing) {
      return existing;
    }
    const cardId = "crd_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const cardData = {
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
      customQuote: friend.customQuote || "Legendary Friend",
      equippedFrame: friend.equippedFrame,
      friendshipDate: (/* @__PURE__ */ new Date()).toISOString(),
      streakDays: 1,
      milestones: ["friendship_started"]
    };
    const card = {
      id: cardId,
      ownerId,
      originalUserId: friend.id,
      friendshipId,
      collectedAt: (/* @__PURE__ */ new Date()).toISOString(),
      cardData
    };
    this.data.cards[cardId] = card;
    return card;
  }
  getCardsForUser(userId) {
    return Object.values(this.data.cards).filter((c) => c.ownerId === userId).sort((a, b) => new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime());
  }
  checkAndAwardAchievements(userId) {
    const user = this.data.users[userId];
    if (!user) return;
    const cardCount = Object.values(this.data.cards).filter((c) => c.ownerId === userId).length;
    const milestones = [
      { count: 10, title: "Collector", frame: "frame_collector" },
      { count: 25, title: "Social Collector", frame: "frame_social" },
      { count: 50, title: "Master Collector", frame: "frame_master" },
      { count: 100, title: "Elite Collector", frame: "frame_elite" },
      { count: 250, title: "TCG Legend", frame: "frame_legend" },
      { count: 500, title: "TCG Icon", frame: "frame_icon" }
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
        type: "streak_milestone",
        title: "\u{1F3C6} Achievement Unlocked!",
        body: `You unlocked new cosmetic rewards for collecting ${cardCount} cards!`
      });
    }
  }
  // --- Leaderboards (Global, Monthly, Weekly) ---
  getLeaderboard(period, currentUserId) {
    const now = /* @__PURE__ */ new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const users = Object.values(this.data.users);
    const entries = users.map((u) => {
      const allCards = Object.values(this.data.cards).filter((c) => c.ownerId === u.id);
      const totalCount = allCards.length;
      const weeklyCards = allCards.filter((c) => new Date(c.collectedAt) >= currentWeekStart);
      const monthlyCards = allCards.filter((c) => new Date(c.collectedAt) >= currentMonthStart);
      let sortScore = totalCount;
      if (period === "weekly") {
        sortScore = weeklyCards.length;
      } else if (period === "monthly") {
        sortScore = monthlyCards.length;
      }
      return {
        rank: 0,
        userId: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        tcgId: u.tcgId,
        cardCount: period === "global" ? totalCount : sortScore,
        weeklyGain: weeklyCards.length,
        monthlyGain: monthlyCards.length,
        equippedTitle: u.equippedTitle,
        equippedFrame: u.equippedFrame,
        cardTheme: u.cardTheme,
        customCardColor: u.customCardColor,
        isCurrentUser: u.id === currentUserId
      };
    });
    entries.sort((a, b) => b.cardCount - a.cardCount);
    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });
    const currentUserRank = currentUserId ? entries.find((e) => e.userId === currentUserId) : void 0;
    return {
      leaderboard: entries,
      currentUserRank,
      totalRegistered: users.length
    };
  }
  // --- Real-Time Messages ---
  sendMessage(params) {
    const { senderId, receiverId, content, type = "text", audioDataUrl, audioDurationSeconds } = params;
    const sender = this.data.users[senderId];
    if (!sender) throw new Error("Sender not found");
    const msgId = "msg_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const msg = {
      id: msgId,
      senderId,
      receiverId,
      content,
      type,
      audioDataUrl,
      audioDurationSeconds,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.messages[msgId] = msg;
    this.recordInteraction(senderId, receiverId, "chat");
    this.createNotification({
      userId: receiverId,
      type: "message",
      title: `\u{1F4AC} ${sender.name}`,
      body: type === "voice" ? "\u{1F399}\uFE0F Sent you a voice message" : content.length > 50 ? content.slice(0, 47) + "..." : content,
      data: { messageId: msgId, senderId, senderName: sender.name }
    });
    this.save();
    this.broadcast(receiverId, "new_message", { message: msg });
    this.broadcast(senderId, "new_message", { message: msg });
    return msg;
  }
  getMessages(user1Id, user2Id) {
    return Object.values(this.data.messages).filter(
      (m) => m.senderId === user1Id && m.receiverId === user2Id || m.senderId === user2Id && m.receiverId === user1Id
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  markMessagesAsRead(currentUserId, friendId) {
    const unread = Object.values(this.data.messages).filter(
      (m) => m.senderId === friendId && m.receiverId === currentUserId && !m.readAt
    );
    const now = (/* @__PURE__ */ new Date()).toISOString();
    unread.forEach((m) => {
      m.readAt = now;
    });
    if (unread.length > 0) {
      this.save();
      this.broadcast(friendId, "messages_read", { readBy: currentUserId, friendId });
    }
  }
  // --- Interaction Streaks & Milestones ---
  recordInteraction(user1Id, user2Id, actionType) {
    const f = this.findFriendship(user1Id, user2Id);
    if (!f) return;
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const lastStr = f.lastInteractionDateStr;
    f.lastInteractionAt = (/* @__PURE__ */ new Date()).toISOString();
    if (actionType === "chat" && !f.milestones.includes("first_chat")) {
      f.milestones.push("first_chat");
    }
    if (actionType === "call" && !f.milestones.includes("first_call")) {
      f.milestones.push("first_call");
    }
    if (actionType === "activity") {
      f.activitiesCompleted = (f.activitiesCompleted || 0) + 1;
      if (!f.milestones.includes("first_activity")) {
        f.milestones.push("first_activity");
      }
    }
    if (lastStr !== todayStr) {
      if (lastStr) {
        const lastDate = new Date(lastStr);
        const todayDate = new Date(todayStr);
        const diffDays = Math.round((todayDate.getTime() - lastDate.getTime()) / (1e3 * 3600 * 24));
        if (diffDays === 1) {
          f.streakDays += 1;
        } else if (diffDays > 2) {
          f.streakDays = 1;
        }
      } else {
        f.streakDays = 1;
      }
      f.lastInteractionDateStr = todayStr;
      if (f.streakDays >= 7 && !f.milestones.includes("streak_7")) {
        f.milestones.push("streak_7");
        this.createNotification({
          userId: user1Id,
          type: "streak_milestone",
          title: "\u{1F525} 7-Day Streak!",
          body: `You and your friend reached a 7-day friendship streak!`
        });
        this.createNotification({
          userId: user2Id,
          type: "streak_milestone",
          title: "\u{1F525} 7-Day Streak!",
          body: `You and your friend reached a 7-day friendship streak!`
        });
      }
      if (f.streakDays >= 30 && !f.milestones.includes("streak_30")) {
        f.milestones.push("streak_30");
      }
      if (f.streakDays >= 100 && !f.milestones.includes("streak_100")) {
        f.milestones.push("streak_100");
      }
      Object.values(this.data.cards).forEach((c) => {
        if (c.ownerId === user1Id && c.originalUserId === user2Id || c.ownerId === user2Id && c.originalUserId === user1Id) {
          c.cardData.streakDays = f.streakDays;
          c.cardData.milestones = f.milestones;
        }
      });
    }
    this.save();
  }
  // --- Notifications ---
  createNotification(params) {
    const id = "notif_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const notif = {
      id,
      ...params,
      read: false,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.notifications[id] = notif;
    this.save();
    this.broadcast(params.userId, "new_notification", { notification: notif });
    return notif;
  }
  getNotifications(userId) {
    return Object.values(this.data.notifications).filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  markNotificationAsRead(id, userId) {
    const n = this.data.notifications[id];
    if (n && n.userId === userId) {
      n.read = true;
      this.save();
    }
  }
  clearAllNotifications(userId) {
    Object.values(this.data.notifications).forEach((n) => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    this.save();
  }
  // --- Safety & Moderation ---
  blockUser(userId, blockedUserId) {
    const id = `blk_${userId}_${blockedUserId}`;
    this.data.blockedUsers[id] = {
      id,
      userId,
      blockedUserId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.save();
  }
  unblockUser(userId, blockedUserId) {
    const id = `blk_${userId}_${blockedUserId}`;
    delete this.data.blockedUsers[id];
    this.save();
  }
  getBlockedUsers(userId) {
    return Object.values(this.data.blockedUsers).filter((b) => b.userId === userId).map((b) => b.blockedUserId);
  }
  reportUser(reporterId, reportedUserId, reason) {
    const id = "rep_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    this.data.reports[id] = {
      id,
      reporterId,
      reportedUserId,
      reason,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.save();
  }
  // --- Recommendations storage ---
  getStoredRecommendations(userId, dateStr) {
    return this.data.dailyRecommendations[`${userId}_${dateStr}`];
  }
  storeDailyRecommendations(userId, dateStr, recommendations) {
    this.data.dailyRecommendations[`${userId}_${dateStr}`] = {
      date: dateStr,
      recommendations
    };
    this.save();
  }
  getAllRegisteredUsers() {
    return Object.values(this.data.users).map((u) => this.sanitizeUser(u));
  }
};
var db = new DatabaseService();

// src/server/gemini.ts
import { GoogleGenAI, Type } from "@google/genai";
var aiInstance = null;
function getAI() {
  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  aiInstance = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  return aiInstance;
}
var MODELS_TO_TRY = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
async function generateWithModelFallback(ai, prompt, responseSchema) {
  for (const model of MODELS_TO_TRY) {
    try {
      const config = {
        temperature: 0.7
      };
      if (responseSchema) {
        config.responseMimeType = "application/json";
        config.responseSchema = responseSchema;
      }
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config
      });
      if (response.text && response.text.trim().length > 0) {
        return response.text.trim();
      }
    } catch (err) {
      const errorMsg = err?.message || String(err);
      const isTemporaryDemand = errorMsg.includes("503") || errorMsg.includes("high demand") || errorMsg.includes("UNAVAILABLE") || errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");
      if (isTemporaryDemand) {
        console.info(`Model ${model} is experiencing high demand. Falling back to alternative model...`);
        continue;
      }
      console.warn(`Gemini generation warning on ${model}:`, err);
    }
  }
  return null;
}
function generateHeuristicExplanation(currentUser, candidate, sharedItems) {
  let score = 76;
  if (sharedItems.length > 0) {
    score += Math.min(18, sharedItems.length * 6);
  }
  if (Math.abs((currentUser.age || 20) - (candidate.age || 20)) <= 3) {
    score += 4;
  }
  const isSameLocation = currentUser.locationArea && candidate.locationArea && currentUser.locationArea.toLowerCase().trim() === candidate.locationArea.toLowerCase().trim();
  if (isSameLocation) {
    score += 2;
  }
  let explanation = "";
  if (sharedItems.length >= 2) {
    const top2 = sharedItems.slice(0, 2).join(" and ");
    if (isSameLocation) {
      explanation = `You both share a passion for ${top2} and are based in ${candidate.locationArea}! Perfect opportunity to connect and start a friendship streak.`;
    } else {
      explanation = `You both love ${top2} with complementary weekend availability. Great potential for co-op chats and deck collection!`;
    }
  } else if (sharedItems.length === 1) {
    explanation = `You both enjoy ${sharedItems[0]}! A great mutual spark to break the ice, trade cards, and level up your friendship.`;
  } else if (isSameLocation) {
    explanation = `You are both in ${candidate.locationArea} with curious minds and active hobby collections. A great local connection to explore!`;
  } else {
    explanation = `You both have creative pursuits, open availability, and active collector profiles. Excellent candidate to expand your Legendary TCG Deck.`;
  }
  return { explanation, score: Math.min(99, Math.max(68, score)) };
}
async function generateMatchExplanations(currentUser, candidates) {
  if (!candidates || candidates.length === 0) return [];
  const ai = getAI();
  const candidateExplanationsMap = /* @__PURE__ */ new Map();
  if (ai) {
    try {
      const candidateSummaries = candidates.map(
        (c, idx) => `Candidate ${idx + 1} (ID: "${c.id}", Name: "${c.name}", Age: ${c.age}):
- Bio: ${c.bio || "Not specified"}
- Hobbies: ${c.hobbies?.join(", ") || "None listed"}
- Interests: ${c.interests?.join(", ") || "None listed"}
- Favorite Activities: ${c.favoriteActivities?.join(", ") || "None listed"}
- Location: ${c.locationArea || "Global"}
- Availability: ${c.availability?.map((a) => `${a.day}: ${a.timeRange}`).join("; ") || "Flexible"}`
      ).join("\n\n");
      const batchedPrompt = `You are the AI Matchmaker for 'TCG Friends', a social friendship app where real people connect and collect Legendary TCG cards for every friendship.

Current User (${currentUser.name}, Age ${currentUser.age}):
- Bio: ${currentUser.bio || "Not specified"}
- Hobbies: ${currentUser.hobbies?.join(", ") || "None listed"}
- Interests: ${currentUser.interests?.join(", ") || "None listed"}
- Favorite Activities: ${currentUser.favoriteActivities?.join(", ") || "None listed"}
- Location: ${currentUser.locationArea || "Global"}
- Availability: ${currentUser.availability?.map((a) => `${a.day}: ${a.timeRange}`).join("; ") || "Flexible"}

Analyze each candidate below and write a warm, engaging, personalized 1-2 sentence explanation of "Why you might get along" based strictly on their actual profile details and shared interests.
Rules:
- Strictly for PLATONIC FRIENDSHIP (no dating/romance).
- Be direct, genuine, and conversational.
- Assign a compatibility score between 70 and 98.

Candidates:
${candidateSummaries}`;
      const schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            candidateId: { type: Type.STRING, description: "The exact ID of the candidate" },
            compatibilityScore: { type: Type.NUMBER, description: "Score between 70 and 98" },
            whyYouMightGetAlong: { type: Type.STRING, description: "1-2 sentence warm explanation" }
          },
          required: ["candidateId", "compatibilityScore", "whyYouMightGetAlong"]
        }
      };
      const rawJson = await generateWithModelFallback(ai, batchedPrompt, schema);
      if (rawJson) {
        try {
          const parsed = JSON.parse(rawJson);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (item.candidateId && item.whyYouMightGetAlong) {
                candidateExplanationsMap.set(item.candidateId, {
                  explanation: item.whyYouMightGetAlong,
                  score: Number(item.compatibilityScore) || void 0
                });
              }
            });
          }
        } catch {
        }
      }
    } catch {
    }
  }
  const results = candidates.map((candidate) => {
    const sharedHobbies = (currentUser.hobbies || []).filter(
      (h) => (candidate.hobbies || []).some((ch) => ch.toLowerCase() === h.toLowerCase())
    );
    const sharedInterests = (currentUser.interests || []).filter(
      (i) => (candidate.interests || []).some((ci) => ci.toLowerCase() === i.toLowerCase())
    );
    const sharedActivities = (currentUser.favoriteActivities || []).filter(
      (a) => (candidate.favoriteActivities || []).some((ca) => ca.toLowerCase() === a.toLowerCase())
    );
    const allShared = Array.from(/* @__PURE__ */ new Set([...sharedHobbies, ...sharedInterests, ...sharedActivities]));
    const heuristic = generateHeuristicExplanation(currentUser, candidate, allShared);
    const aiResult = candidateExplanationsMap.get(candidate.id);
    const finalExplanation = aiResult?.explanation || heuristic.explanation;
    const finalScore = aiResult?.score || heuristic.score;
    return {
      user: {
        id: candidate.id,
        name: candidate.name,
        age: candidate.age,
        tcgId: candidate.tcgId,
        avatarUrl: candidate.avatarUrl,
        bio: candidate.bio,
        hobbies: candidate.hobbies,
        interests: candidate.interests,
        favoriteActivities: candidate.favoriteActivities,
        locationArea: candidate.locationArea,
        availability: candidate.availability,
        cardTheme: candidate.cardTheme,
        customQuote: candidate.customQuote,
        equippedFrame: candidate.equippedFrame,
        equippedTitle: candidate.equippedTitle,
        onlineStatus: candidate.onlineStatus,
        cardsCount: 0,
        isFriend: false,
        hasPendingRequest: false
      },
      compatibilityScore: Math.min(99, Math.max(65, finalScore)),
      whyYouMightGetAlong: finalExplanation,
      sharedInterests: allShared
    };
  });
  return results;
}

// src/server/api.ts
var apiRouter = express.Router();
apiRouter.use(express.json({ limit: "15mb" }));
function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  return db.getUserById(token);
}
apiRouter.get("/events", (req, res) => {
  const token = req.query.token || "";
  const user = db.getUserById(token);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  const clientId = (user ? user.id : "anon") + "_" + Math.random().toString(36).substring(2, 9);
  if (user) {
    db.setOnlineStatus(user.id, "online");
  }
  res.write(`data: ${JSON.stringify({ type: "connected", clientId })}

`);
  const unsubscribe = db.subscribe(clientId, (event) => {
    res.write(`data: ${JSON.stringify(event)}

`);
  });
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat

`);
  }, 25e3);
  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    if (user) {
      db.setOnlineStatus(user.id, "recently_active");
    }
  });
});
apiRouter.post("/auth/register", (req, res) => {
  try {
    const { email, password, name, age, avatarUrl, bio, hobbies, interests, favoriteActivities, locationArea } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    const user = db.createUser({
      email,
      password,
      name,
      age: Number(age) || 18,
      avatarUrl,
      bio,
      hobbies: Array.isArray(hobbies) ? hobbies : [],
      interests: Array.isArray(interests) ? interests : [],
      favoriteActivities: Array.isArray(favoriteActivities) ? favoriteActivities : [],
      locationArea
    });
    return res.status(201).json({
      user,
      token: user.id
    });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Registration failed" });
  }
});
apiRouter.post("/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const cleanEmail = email.trim();
    const user = db.verifyUser(cleanEmail, password);
    if (!user) {
      const emailExists = db.getAllRegisteredUsers().some(
        (u) => u.email.toLowerCase() === cleanEmail.toLowerCase()
      );
      if (!emailExists) {
        return res.status(401).json({
          error: "No account found with this email. Please check your email or click Sign Up to create an account.",
          code: "USER_NOT_FOUND"
        });
      }
      return res.status(401).json({
        error: 'Incorrect password. Please try again or use "Forgot password?".',
        code: "INVALID_PASSWORD"
      });
    }
    return res.json({
      user,
      token: user.id
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Login failed" });
  }
});
apiRouter.post("/auth/reset-password", (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }
    const success = db.resetPassword(email, newPassword);
    if (!success) {
      return res.status(404).json({ error: "No account found with this email." });
    }
    return res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Password reset failed" });
  }
});
apiRouter.get("/auth/me", (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return res.json({ user });
});
apiRouter.post("/auth/logout", (req, res) => {
  const user = getAuthUser(req);
  if (user) {
    db.setOnlineStatus(user.id, "offline");
  }
  return res.json({ success: true });
});
apiRouter.put("/users/profile", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const {
      name,
      age,
      avatarUrl,
      bio,
      hobbies,
      interests,
      favoriteActivities,
      locationArea,
      availability,
      availabilityPrivacy,
      cardTheme,
      customQuote,
      equippedFrame,
      equippedTitle,
      hasCompletedTutorial
    } = req.body;
    const updated = db.updateUser(user.id, {
      ...name !== void 0 && { name },
      ...age !== void 0 && { age: Number(age) },
      ...avatarUrl !== void 0 && { avatarUrl },
      ...bio !== void 0 && { bio },
      ...hobbies !== void 0 && { hobbies },
      ...interests !== void 0 && { interests },
      ...favoriteActivities !== void 0 && { favoriteActivities },
      ...locationArea !== void 0 && { locationArea },
      ...availability !== void 0 && { availability },
      ...availabilityPrivacy !== void 0 && { availabilityPrivacy },
      ...cardTheme !== void 0 && { cardTheme },
      ...customQuote !== void 0 && { customQuote },
      ...equippedFrame !== void 0 && { equippedFrame },
      ...equippedTitle !== void 0 && { equippedTitle },
      ...hasCompletedTutorial !== void 0 && { hasCompletedTutorial }
    });
    return res.json({ user: updated });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Update failed" });
  }
});
apiRouter.get("/users/by-tcgid/:tcgId", (req, res) => {
  const user = getAuthUser(req);
  const { tcgId } = req.params;
  const profile = db.getUserByTCGId(tcgId);
  if (!profile) {
    return res.status(404).json({ error: `No user found with TCG ID: ${tcgId}` });
  }
  return res.json({
    profile: db.toPublicProfile(db.getUserById(profile.id), user?.id)
  });
});
apiRouter.get("/users/profile/:id", (req, res) => {
  const user = getAuthUser(req);
  const target = db.getUserById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ profile: db.toPublicProfile(target, user?.id) });
});
apiRouter.get("/discover/daily", async (req, res) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const cached = db.getStoredRecommendations(user.id, todayStr);
    if (cached && cached.recommendations && cached.recommendations.length > 0) {
      const refreshed = cached.recommendations.map((rec) => {
        const targetUser = db.getUserById(rec.user.id);
        return {
          ...rec,
          user: targetUser ? db.toPublicProfile(targetUser, user.id) : rec.user
        };
      });
      return res.json({ recommendations: refreshed, date: todayStr });
    }
    const allUsers = db.getAllRegisteredUsers();
    const friends = db.getFriendsForUser(user.id).map((f) => f.friend.id);
    const blocked = db.getBlockedUsers(user.id);
    const eligibleCandidates = allUsers.filter(
      (u) => u.id !== user.id && !friends.includes(u.id) && !blocked.includes(u.id)
    );
    if (eligibleCandidates.length === 0) {
      return res.json({
        recommendations: [],
        date: todayStr,
        message: "You're one of the first TCG Friends users! Invite someone using your TCG ID to start collecting cards."
      });
    }
    const shuffled = [...eligibleCandidates].sort(() => 0.5 - Math.random());
    const selectedCandidates = shuffled.slice(0, 3);
    const recommendations = await generateMatchExplanations(user, selectedCandidates);
    db.storeDailyRecommendations(user.id, todayStr, recommendations);
    return res.json({ recommendations, date: todayStr });
  } catch (err) {
    console.error("Error generating daily recommendations:", err);
    return res.status(500).json({ error: "Failed to retrieve recommendations" });
  }
});
apiRouter.get("/friends/requests", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const incoming = Object.values(db.data.friendRequests).filter((r) => r.receiverId === user.id && r.status === "pending").map((r) => {
    const sender = db.getUserById(r.senderId);
    return {
      ...r,
      senderProfile: sender ? db.toPublicProfile(sender, user.id) : void 0
    };
  });
  const outgoing = Object.values(db.data.friendRequests).filter((r) => r.senderId === user.id && r.status === "pending").map((r) => {
    const receiver = db.getUserById(r.receiverId);
    return {
      ...r,
      receiverProfile: receiver ? db.toPublicProfile(receiver, user.id) : void 0
    };
  });
  return res.json({ incoming, outgoing });
});
apiRouter.post("/friends/requests", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: "Target user ID is required." });
  }
  try {
    const request = db.sendFriendRequest(user.id, targetUserId);
    return res.status(201).json({ request });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Could not send friend request" });
  }
});
apiRouter.post("/friends/requests/:id/respond", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params;
  const { action } = req.body;
  try {
    if (action === "accept") {
      const reqRecord = db.acceptFriendRequest(id, user.id);
      return res.json({ success: true, request: reqRecord });
    } else if (action === "decline") {
      const reqRecord = db.declineFriendRequest(id, user.id);
      return res.json({ success: true, request: reqRecord });
    } else {
      return res.status(400).json({ error: "Invalid action. Must be accept or decline." });
    }
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to respond to request" });
  }
});
apiRouter.get("/friends/list", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const friends = db.getFriendsForUser(user.id);
  return res.json({ friends });
});
apiRouter.delete("/friends/:friendshipId", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const success = db.removeFriendship(req.params.friendshipId, user.id);
  return res.json({ success });
});
apiRouter.post("/friends/activity/complete", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { friendId, activityType, score } = req.body;
  if (!friendId) return res.status(400).json({ error: "friendId required" });
  db.recordInteraction(user.id, friendId, "activity");
  const msg = db.sendMessage({
    senderId: user.id,
    receiverId: friendId,
    content: `\u{1F3AE} Completed friendship activity: ${activityType || "Trivia Match"}! Streak reinforced!`,
    type: "activity_prompt"
  });
  return res.json({ success: true, message: msg });
});
apiRouter.get("/cards/collection", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const cards = db.getCardsForUser(user.id);
  const leaderboardInfo = db.getLeaderboard("global", user.id);
  return res.json({
    cards,
    totalCards: cards.length,
    globalRank: leaderboardInfo.currentUserRank?.rank || 1,
    weeklyGain: leaderboardInfo.currentUserRank?.weeklyGain || 0
  });
});
apiRouter.get("/messages/:friendId", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { friendId } = req.params;
  const messages = db.getMessages(user.id, friendId);
  db.markMessagesAsRead(user.id, friendId);
  return res.json({ messages });
});
apiRouter.post("/messages", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { receiverId, content, type, audioDataUrl, audioDurationSeconds } = req.body;
  if (!receiverId || !content && !audioDataUrl) {
    return res.status(400).json({ error: "Receiver ID and content are required" });
  }
  try {
    const msg = db.sendMessage({
      senderId: user.id,
      receiverId,
      content: content || "Voice Message",
      type: type || (audioDataUrl ? "voice" : "text"),
      audioDataUrl,
      audioDurationSeconds
    });
    return res.status(201).json({ message: msg });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to send message" });
  }
});
apiRouter.post("/messages/mark-read", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { friendId } = req.body;
  if (friendId) {
    db.markMessagesAsRead(user.id, friendId);
  }
  return res.json({ success: true });
});
apiRouter.post("/webrtc/signal", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const signal = req.body;
  const receiver = db.getUserById(signal.receiverId);
  if (!receiver) {
    return res.status(404).json({ error: "Recipient user not found" });
  }
  if (signal.type === "offer" || signal.type === "answer") {
    db.recordInteraction(user.id, signal.receiverId, "call");
  }
  db.broadcast(signal.receiverId, "webrtc_signal", {
    ...signal,
    callerId: user.id,
    callerName: user.name,
    callerAvatar: user.avatarUrl
  });
  return res.json({ success: true });
});
apiRouter.get("/notifications", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const notifications = db.getNotifications(user.id);
  return res.json({ notifications });
});
apiRouter.post("/notifications/:id/read", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  db.markNotificationAsRead(req.params.id, user.id);
  return res.json({ success: true });
});
apiRouter.post("/notifications/clear", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  db.clearAllNotifications(user.id);
  return res.json({ success: true });
});
apiRouter.get("/leaderboard", (req, res) => {
  const user = getAuthUser(req);
  const period = req.query.period || "global";
  const result = db.getLeaderboard(period, user?.id);
  return res.json(result);
});
apiRouter.post("/safety/block", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: "Target user required" });
  db.blockUser(user.id, targetUserId);
  return res.json({ success: true, message: "User blocked" });
});
apiRouter.post("/safety/unblock", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: "Target user required" });
  db.unblockUser(user.id, targetUserId);
  return res.json({ success: true, message: "User unblocked" });
});
apiRouter.post("/safety/report", (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  const { reportedUserId, reason } = req.body;
  if (!reportedUserId || !reason) {
    return res.status(400).json({ error: "Reported user ID and reason are required." });
  }
  db.reportUser(user.id, reportedUserId, reason);
  return res.json({ success: true, message: "Report submitted. Our moderation team will review." });
});

// src/server/vercel-entry.ts
dotenv.config();
var app = express2();
app.use(express2.json({ limit: "15mb" }));
app.use(express2.urlencoded({ extended: true, limit: "15mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});
app.use("/api", apiRouter);
app.use("/", apiRouter);
app.use((req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});
app.use((err, req, res, _next) => {
  console.error("API Server Error:", err);
  const statusCode = typeof err?.status === "number" ? err.status : 500;
  res.status(statusCode).json({
    error: err?.message || "Internal Server Error",
    code: err?.code || "SERVER_ERROR"
  });
});
var vercel_entry_default = app;
export {
  vercel_entry_default as default
};
