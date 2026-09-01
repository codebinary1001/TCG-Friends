import React, { useEffect, useRef, useState } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, PhoneCall, Volume2, Shield } from 'lucide-react';
import { motion } from 'motion/react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const WebRTCCallModal: React.FC = () => {
  const {
    activeCall,
    incomingCallPrompt,
    acceptIncomingCall,
    declineIncomingCall,
    endActiveCall,
    sendWebRTCSignal,
  } = useRealtime();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'Connecting' | 'Connected' | 'Disconnected'>('Connecting');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Incoming Call Prompt Floating Banner / Modal
  if (incomingCallPrompt && !activeCall) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm bg-slate-900 border-2 border-indigo-500/80 rounded-[50px] p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center"
        >
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-[200px] bg-indigo-500/30 animate-ping" />
            <img
              src={incomingCallPrompt.partnerAvatar}
              alt={incomingCallPrompt.partnerName}
              className="relative w-24 h-24 rounded-[200px] border-4 border-indigo-400 object-cover shadow-xl"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[200px] bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
            <span>Incoming {incomingCallPrompt.callType === 'video' ? 'Video' : 'Voice'} Call</span>
          </div>

          <h3 className="text-xl font-bold text-white mb-1">
            {incomingCallPrompt.partnerName}
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Your friend is calling you to chat & maintain friendship streak!
          </p>

          <div className="flex items-center justify-center gap-6 w-full">
            <button
              onClick={declineIncomingCall}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-14 h-14 rounded-[200px] bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                <PhoneOff className="w-6 h-6" />
              </div>
              <span className="text-xs text-rose-300 font-medium">Decline</span>
            </button>

            <button
              onClick={acceptIncomingCall}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="w-14 h-14 rounded-[200px] bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform group-hover:scale-110 animate-bounce">
                <Phone className="w-6 h-6" />
              </div>
              <span className="text-xs text-emerald-300 font-bold">Accept</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!activeCall) return null;

  // Active call WebRTC setup
  useEffect(() => {
    let timer: any = null;
    let isCancelled = false;

    const setupWebRTC = async () => {
      try {
        setPermissionError(null);
        const constraints = {
          audio: true,
          video: activeCall.callType === 'video',
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setConnectionStatus('Connected');
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendWebRTCSignal({
              callId: activeCall.callId,
              receiverId: activeCall.partnerId,
              type: 'ice-candidate',
              candidate: event.candidate,
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setConnectionStatus('Connected');
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            setConnectionStatus('Disconnected');
          }
        };

        // If initiating call, create offer
        if (!activeCall.isIncoming) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendWebRTCSignal({
            callId: activeCall.callId,
            receiverId: activeCall.partnerId,
            callType: activeCall.callType,
            type: 'offer',
            sdp: offer,
          });
        }

        // Timer
        timer = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      } catch (err: any) {
        console.error('Media stream error:', err);
        setPermissionError(
          'Microphone / Camera access denied or not available. Voice and video calling requires device permissions.'
        );
      }
    };

    setupWebRTC();

    return () => {
      isCancelled = true;
      if (timer) clearInterval(timer);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, [activeCall.callId]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[50px] overflow-hidden shadow-2xl flex flex-col h-[520px] max-h-[90vh]"
      >
        {/* Top bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <img
              src={activeCall.partnerAvatar}
              alt={activeCall.partnerName}
              className="w-10 h-10 rounded-[200px] object-cover border border-indigo-400"
            />
            <div>
              <h4 className="font-bold text-white text-sm">{activeCall.partnerName}</h4>
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`w-2 h-2 rounded-[200px] ${
                    connectionStatus === 'Connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span className="text-slate-400">
                  {connectionStatus === 'Connected' ? formatTimer(callDuration) : 'Calling friend...'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1 rounded-[200px] bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              {activeCall.callType === 'video' ? 'HD Video Call' : 'Encrypted Voice Call'}
            </div>
          </div>
        </div>

        {/* Video / Call Center Area */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          {permissionError ? (
            <div className="p-6 text-center max-w-sm">
              <Shield className="w-10 h-10 text-rose-400 mx-auto mb-2" />
              <p className="text-sm text-rose-300">{permissionError}</p>
            </div>
          ) : activeCall.callType === 'video' ? (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Video Picture-in-Picture */}
              <div className="absolute top-4 right-4 w-32 h-44 sm:w-40 sm:h-52 bg-slate-900 rounded-[30px] overflow-hidden border-2 border-indigo-400 shadow-xl z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-xs gap-1">
                    <VideoOff className="w-6 h-6" />
                    <span>Camera Off</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Voice Call Graphic Screen */
            <div className="flex flex-col items-center gap-4 text-center p-6">
              <div className="relative">
                <div className="absolute -inset-4 rounded-[200px] bg-indigo-500/20 animate-pulse" />
                <img
                  src={activeCall.partnerAvatar}
                  alt={activeCall.partnerName}
                  className="relative w-28 h-28 rounded-[200px] border-4 border-indigo-400 object-cover shadow-2xl"
                />
                <div className="absolute bottom-0 right-0 p-2 rounded-[200px] bg-emerald-500 text-white shadow-md">
                  <Volume2 className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">{activeCall.partnerName}</h3>
                <p className="text-sm text-slate-400 mt-0.5">
                  {connectionStatus === 'Connected' ? 'Voice connected' : 'Connecting to peer...'}
                </p>
              </div>

              {/* Audio element for remote stream */}
              <audio ref={remoteVideoRef as any} autoPlay />
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-center gap-4 z-10">
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-[200px] transition-colors ${
              isMuted
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {activeCall.callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-3.5 rounded-[200px] transition-colors ${
                isVideoOff
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
              title={isVideoOff ? 'Turn video on' : 'Turn video off'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={endActiveCall}
            className="px-6 py-3.5 rounded-[200px] bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-transform hover:scale-105"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
