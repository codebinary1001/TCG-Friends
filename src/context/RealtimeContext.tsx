import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { NotificationItem, TCGCard, WebRTCSignalingMessage, Message } from '../types/tcg';
import confetti from 'canvas-confetti';

interface ActiveCallState {
  callId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  callType: 'audio' | 'video';
  isIncoming: boolean;
  status: 'ringing' | 'connected' | 'ended';
}

interface RealtimeContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  unlockedCard: TCGCard | null;
  setUnlockedCard: (card: TCGCard | null) => void;
  activeCall: ActiveCallState | null;
  incomingCallPrompt: ActiveCallState | null;
  initiateCall: (partnerId: string, partnerName: string, partnerAvatar: string, callType: 'audio' | 'video') => void;
  acceptIncomingCall: () => void;
  declineIncomingCall: () => void;
  endActiveCall: () => void;
  sendWebRTCSignal: (payload: Partial<WebRTCSignalingMessage>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refetchNotifications: () => Promise<void>;
  onMessageReceived?: (msg: Message) => void;
  setOnMessageReceived: (cb: ((msg: Message) => void) | null) => void;
  onlineUserIds: Set<string>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, token, refetchUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unlockedCard, setUnlockedCard] = useState<TCGCard | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [incomingCallPrompt, setIncomingCallPrompt] = useState<ActiveCallState | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  const messageCallbackRef = useRef<((msg: Message) => void) | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error('Error fetching notifications', e);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchNotifications();
    } else {
      setNotifications([]);
    }
  }, [token, fetchNotifications]);

  // Connect to SSE
  useEffect(() => {
    if (!token || !currentUser) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      eventSource = new EventSource(`/api/events?token=${token}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleRealtimeEvent(data);
        } catch (e) {
          // ignore heartbeat
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
        }
        reconnectTimeout = setTimeout(connect, 4000);
      };
    };

    const handleRealtimeEvent = (data: { type: string; payload: any }) => {
      const { type, payload } = data;

      if (type === 'new_notification') {
        const notif: NotificationItem = payload.notification;
        setNotifications((prev) => [notif, ...prev]);

        // If card unlock notification, trigger celebratory confetti!
        if (notif.type === 'card_unlocked' && notif.data?.card) {
          setUnlockedCard(notif.data.card);
          triggerConfettiCelebration();
          refetchUser();
        }
      } else if (type === 'friendship_accepted') {
        if (payload.newCard) {
          setUnlockedCard(payload.newCard);
          triggerConfettiCelebration();
          refetchUser();
        }
        fetchNotifications();
      } else if (type === 'new_message') {
        if (messageCallbackRef.current) {
          messageCallbackRef.current(payload.message);
        }
      } else if (type === 'user_presence') {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          if (payload.status === 'online') {
            next.add(payload.userId);
          } else {
            next.delete(payload.userId);
          }
          return next;
        });
      } else if (type === 'webrtc_signal') {
        handleIncomingSignaling(payload);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (eventSource) eventSource.close();
    };
  }, [token, currentUser]);

  const triggerConfettiCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981'],
    });
  };

  const handleIncomingSignaling = (signal: WebRTCSignalingMessage) => {
    if (signal.type === 'ringing' || signal.type === 'offer') {
      setIncomingCallPrompt({
        callId: signal.callId,
        partnerId: signal.callerId,
        partnerName: signal.callerName,
        partnerAvatar: signal.callerAvatar,
        callType: signal.callType,
        isIncoming: true,
        status: 'ringing',
      });
    } else if (signal.type === 'end' || signal.type === 'declined' || signal.type === 'busy') {
      setIncomingCallPrompt(null);
      setActiveCall((prev) => (prev ? { ...prev, status: 'ended' } : null));
      setTimeout(() => setActiveCall(null), 1200);
    } else if (signal.type === 'answer') {
      setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
    }
  };

  const sendWebRTCSignal = async (payload: Partial<WebRTCSignalingMessage>) => {
    if (!token) return;
    try {
      await fetch('/api/webrtc/signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error('Error sending WebRTC signal', e);
    }
  };

  const initiateCall = (partnerId: string, partnerName: string, partnerAvatar: string, callType: 'audio' | 'video') => {
    const callId = 'call_' + Math.random().toString(36).substring(2, 10);
    setActiveCall({
      callId,
      partnerId,
      partnerName,
      partnerAvatar,
      callType,
      isIncoming: false,
      status: 'ringing',
    });

    sendWebRTCSignal({
      callId,
      receiverId: partnerId,
      callType,
      type: 'ringing',
    });
  };

  const acceptIncomingCall = () => {
    if (!incomingCallPrompt) return;
    setActiveCall({
      ...incomingCallPrompt,
      status: 'connected',
    });
    setIncomingCallPrompt(null);
  };

  const declineIncomingCall = () => {
    if (!incomingCallPrompt) return;
    sendWebRTCSignal({
      callId: incomingCallPrompt.callId,
      receiverId: incomingCallPrompt.partnerId,
      callType: incomingCallPrompt.callType,
      type: 'declined',
    });
    setIncomingCallPrompt(null);
  };

  const endActiveCall = () => {
    if (activeCall) {
      sendWebRTCSignal({
        callId: activeCall.callId,
        receiverId: activeCall.partnerId,
        callType: activeCall.callType,
        type: 'end',
      });
    }
    setActiveCall(null);
    setIncomingCallPrompt(null);
  };

  const markNotificationRead = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const clearAllNotifications = async () => {
    if (!token) return;
    try {
      await fetch('/api/notifications/clear', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const setOnMessageReceived = (cb: ((msg: Message) => void) | null) => {
    messageCallbackRef.current = cb;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <RealtimeContext.Provider
      value={{
        notifications,
        unreadCount,
        unlockedCard,
        setUnlockedCard,
        activeCall,
        incomingCallPrompt,
        initiateCall,
        acceptIncomingCall,
        declineIncomingCall,
        endActiveCall,
        sendWebRTCSignal,
        markNotificationRead,
        clearAllNotifications,
        refetchNotifications: fetchNotifications,
        onMessageReceived: messageCallbackRef.current || undefined,
        setOnMessageReceived,
        onlineUserIds,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};
