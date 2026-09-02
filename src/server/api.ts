import express from 'express';
import type { Request, Response } from 'express';
import { db } from './db.ts';
import { generateMatchExplanations } from './gemini.ts';
import type { WebRTCSignalingMessage } from '../types/tcg.ts';

export const apiRouter = express.Router();

apiRouter.use(express.json({ limit: '15mb' }));

// Helper to extract authenticated user from Authorization header
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  // Simple persistent session token format: usr_...
  return db.getUserById(token);
}

// -------------------------------------------------------------
// REAL-TIME SERVER-SENT EVENTS (SSE)
// -------------------------------------------------------------
apiRouter.get('/events', (req: Request, res: Response) => {
  const token = (req.query.token as string) || '';
  const user = db.getUserById(token);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = (user ? user.id : 'anon') + '_' + Math.random().toString(36).substring(2, 9);

  if (user) {
    db.setOnlineStatus(user.id, 'online');
  }

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  const unsubscribe = db.subscribe(clientId, (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    if (user) {
      db.setOnlineStatus(user.id, 'recently_active');
    }
  });
});

// -------------------------------------------------------------
// AUTHENTICATION ROUTES
// -------------------------------------------------------------
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, name, age, avatarUrl, bio, hobbies, interests, favoriteActivities, locationArea } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
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
      locationArea,
    });

    return res.status(201).json({
      user,
      token: user.id,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim();
    const user = db.verifyUser(cleanEmail, password);
    if (!user) {
      const emailExists = db.getAllRegisteredUsers().some(
        (u) => u.email.toLowerCase() === cleanEmail.toLowerCase()
      );
      if (!emailExists) {
        return res.status(401).json({
          error: 'No account found with this email. Please check your email or click Sign Up to create an account.',
          code: 'USER_NOT_FOUND',
        });
      }
      return res.status(401).json({
        error: 'Incorrect password. Please try again or use "Forgot password?".',
        code: 'INVALID_PASSWORD',
      });
    }

    return res.json({
      user,
      token: user.id,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const success = db.resetPassword(email, newPassword);
    if (!success) {
      return res.status(404).json({ error: 'No account found with this email.' });
    }

    return res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Password reset failed' });
  }
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (user) {
    db.setOnlineStatus(user.id, 'offline');
  }
  return res.json({ success: true });
});

// -------------------------------------------------------------
// USER PROFILE & TCG ID SEARCH
// -------------------------------------------------------------
apiRouter.put('/users/profile', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

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
      hasCompletedTutorial,
    } = req.body;

    const updated = db.updateUser(user.id, {
      ...(name !== undefined && { name }),
      ...(age !== undefined && { age: Number(age) }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(bio !== undefined && { bio }),
      ...(hobbies !== undefined && { hobbies }),
      ...(interests !== undefined && { interests }),
      ...(favoriteActivities !== undefined && { favoriteActivities }),
      ...(locationArea !== undefined && { locationArea }),
      ...(availability !== undefined && { availability }),
      ...(availabilityPrivacy !== undefined && { availabilityPrivacy }),
      ...(cardTheme !== undefined && { cardTheme }),
      ...(customQuote !== undefined && { customQuote }),
      ...(equippedFrame !== undefined && { equippedFrame }),
      ...(equippedTitle !== undefined && { equippedTitle }),
      ...(hasCompletedTutorial !== undefined && { hasCompletedTutorial }),
    });

    return res.json({ user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Update failed' });
  }
});

apiRouter.get('/users/by-tcgid/:tcgId', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { tcgId } = req.params;
  const profile = db.getUserByTCGId(tcgId);

  if (!profile) {
    return res.status(404).json({ error: `No user found with TCG ID: ${tcgId}` });
  }

  return res.json({
    profile: db.toPublicProfile(db.getUserById(profile.id)!, user?.id),
  });
});

apiRouter.get('/users/profile/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const target = db.getUserById(req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ profile: db.toPublicProfile(target, user?.id) });
});

// -------------------------------------------------------------
// DAILY 3 AI MATCHING
// -------------------------------------------------------------
apiRouter.get('/discover/daily', async (req: Request, res: Response) => {
  try {
    const user = getAuthUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const todayStr = new Date().toISOString().split('T')[0];

    // Check cached recommendations for today
    const cached = db.getStoredRecommendations(user.id, todayStr);
    if (cached && cached.recommendations && cached.recommendations.length > 0) {
      // Refresh public profile friend/request statuses
      const refreshed = cached.recommendations.map((rec: any) => {
        const targetUser = db.getUserById(rec.user.id);
        return {
          ...rec,
          user: targetUser ? db.toPublicProfile(targetUser, user.id) : rec.user,
        };
      });
      return res.json({ recommendations: refreshed, date: todayStr });
    }

    // Find real candidates (excluding self, existing friends, and blocked users)
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
        message: "You're one of the first TCG Friends users! Invite someone using your TCG ID to start collecting cards.",
      });
    }

    // Shuffle and pick up to 3 candidates
    const shuffled = [...eligibleCandidates].sort(() => 0.5 - Math.random());
    const selectedCandidates = shuffled.slice(0, 3);

    // Generate AI explanations using Gemini API
    const recommendations = await generateMatchExplanations(user, selectedCandidates);

    // Store for today
    db.storeDailyRecommendations(user.id, todayStr, recommendations);

    return res.json({ recommendations, date: todayStr });
  } catch (err) {
    console.error('Error generating daily recommendations:', err);
    return res.status(500).json({ error: 'Failed to retrieve recommendations' });
  }
});

// -------------------------------------------------------------
// FRIEND REQUESTS & FRIENDSHIPS
// -------------------------------------------------------------
apiRouter.get('/friends/requests', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Get incoming requests
  const incoming = Object.values((db as any).data.friendRequests)
    .filter((r: any) => r.receiverId === user.id && r.status === 'pending')
    .map((r: any) => {
      const sender = db.getUserById(r.senderId);
      return {
        ...r,
        senderProfile: sender ? db.toPublicProfile(sender, user.id) : undefined,
      };
    });

  // Get outgoing requests
  const outgoing = Object.values((db as any).data.friendRequests)
    .filter((r: any) => r.senderId === user.id && r.status === 'pending')
    .map((r: any) => {
      const receiver = db.getUserById(r.receiverId);
      return {
        ...r,
        receiverProfile: receiver ? db.toPublicProfile(receiver, user.id) : undefined,
      };
    });

  return res.json({ incoming, outgoing });
});

apiRouter.post('/friends/requests', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { targetUserId } = req.body;
  if (!targetUserId) {
    return res.status(400).json({ error: 'Target user ID is required.' });
  }

  try {
    const request = db.sendFriendRequest(user.id, targetUserId);
    return res.status(201).json({ request });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Could not send friend request' });
  }
});

apiRouter.post('/friends/requests/:id/respond', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { action } = req.body; // 'accept' | 'decline'

  try {
    if (action === 'accept') {
      const reqRecord = db.acceptFriendRequest(id, user.id);
      return res.json({ success: true, request: reqRecord });
    } else if (action === 'decline') {
      const reqRecord = db.declineFriendRequest(id, user.id);
      return res.json({ success: true, request: reqRecord });
    } else {
      return res.status(400).json({ error: 'Invalid action. Must be accept or decline.' });
    }
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to respond to request' });
  }
});

apiRouter.get('/friends/list', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const friends = db.getFriendsForUser(user.id);
  return res.json({ friends });
});

apiRouter.delete('/friends/:friendshipId', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const success = db.removeFriendship(req.params.friendshipId, user.id);
  return res.json({ success });
});

// Interactive Mini-game / Activity completion (Streaks & Milestones)
apiRouter.post('/friends/activity/complete', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { friendId, activityType, score } = req.body;
  if (!friendId) return res.status(400).json({ error: 'friendId required' });

  db.recordInteraction(user.id, friendId, 'activity');

  // Broadcast activity completion message to chat
  const msg = db.sendMessage({
    senderId: user.id,
    receiverId: friendId,
    content: `🎮 Completed friendship activity: ${activityType || 'Trivia Match'}! Streak reinforced!`,
    type: 'activity_prompt',
  });

  return res.json({ success: true, message: msg });
});

// -------------------------------------------------------------
// CARDS & COLLECTION
// -------------------------------------------------------------
apiRouter.get('/cards/collection', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const cards = db.getCardsForUser(user.id);
  const leaderboardInfo = db.getLeaderboard('global', user.id);

  return res.json({
    cards,
    totalCards: cards.length,
    globalRank: leaderboardInfo.currentUserRank?.rank || 1,
    weeklyGain: leaderboardInfo.currentUserRank?.weeklyGain || 0,
  });
});

// -------------------------------------------------------------
// REAL-TIME MESSAGING
// -------------------------------------------------------------
apiRouter.get('/messages/:friendId', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { friendId } = req.params;
  const messages = db.getMessages(user.id, friendId);
  db.markMessagesAsRead(user.id, friendId);

  return res.json({ messages });
});

apiRouter.post('/messages', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { receiverId, content, type, audioDataUrl, audioDurationSeconds } = req.body;
  if (!receiverId || (!content && !audioDataUrl)) {
    return res.status(400).json({ error: 'Receiver ID and content are required' });
  }

  try {
    const msg = db.sendMessage({
      senderId: user.id,
      receiverId,
      content: content || 'Voice Message',
      type: type || (audioDataUrl ? 'voice' : 'text'),
      audioDataUrl,
      audioDurationSeconds,
    });

    return res.status(201).json({ message: msg });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Failed to send message' });
  }
});

apiRouter.post('/messages/mark-read', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { friendId } = req.body;
  if (friendId) {
    db.markMessagesAsRead(user.id, friendId);
  }
  return res.json({ success: true });
});

// -------------------------------------------------------------
// WEBRTC SIGNALING (AUDIO & VIDEO CALLS)
// -------------------------------------------------------------
apiRouter.post('/webrtc/signal', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const signal: WebRTCSignalingMessage = req.body;

  // Security check: ensure friends or caller
  const receiver = db.getUserById(signal.receiverId);
  if (!receiver) {
    return res.status(404).json({ error: 'Recipient user not found' });
  }

  if (signal.type === 'offer' || signal.type === 'answer') {
    db.recordInteraction(user.id, signal.receiverId, 'call');
  }

  // Push signaling payload directly to recipient client via SSE
  db.broadcast(signal.receiverId, 'webrtc_signal', {
    ...signal,
    callerId: user.id,
    callerName: user.name,
    callerAvatar: user.avatarUrl,
  });

  return res.json({ success: true });
});

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
apiRouter.get('/notifications', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const notifications = db.getNotifications(user.id);
  return res.json({ notifications });
});

apiRouter.post('/notifications/:id/read', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  db.markNotificationAsRead(req.params.id, user.id);
  return res.json({ success: true });
});

apiRouter.post('/notifications/clear', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  db.clearAllNotifications(user.id);
  return res.json({ success: true });
});

// -------------------------------------------------------------
// LEADERBOARD (GLOBAL, MONTHLY, WEEKLY)
// -------------------------------------------------------------
apiRouter.get('/leaderboard', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const period = (req.query.period as 'global' | 'monthly' | 'weekly') || 'global';

  const result = db.getLeaderboard(period, user?.id);
  return res.json(result);
});

// -------------------------------------------------------------
// SAFETY & REPORTING
// -------------------------------------------------------------
apiRouter.post('/safety/block', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'Target user required' });

  db.blockUser(user.id, targetUserId);
  return res.json({ success: true, message: 'User blocked' });
});

apiRouter.post('/safety/unblock', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'Target user required' });

  db.unblockUser(user.id, targetUserId);
  return res.json({ success: true, message: 'User unblocked' });
});

apiRouter.post('/safety/report', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { reportedUserId, reason } = req.body;
  if (!reportedUserId || !reason) {
    return res.status(400).json({ error: 'Reported user ID and reason are required.' });
  }

  db.reportUser(user.id, reportedUserId, reason);
  return res.json({ success: true, message: 'Report submitted. Our moderation team will review.' });
});
