import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCw, 
  Radio, 
  VideoOff, 
  Wifi, 
  WifiOff, 
  Clock, 
  Gauge, 
  Navigation,
  ShieldCheck
} from 'lucide-react';
import { StreamConfig } from '../types';

interface StreamPlayerProps {
  config: StreamConfig;
  onRefresh: () => void;
  isRefreshing: boolean;
}

// Sample video for realistic vehicle route feed (public domain driving video loop)
const SAMPLE_STREAM_SRC = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
// Public HLS test stream fallback if user tests HLS mode
const TEST_HLS_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

export const StreamPlayer: React.FC<StreamPlayerProps> = ({
  config,
  onRefresh,
  isRefreshing,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [timecode, setTimecode] = useState<string>('');
  const [speed, setSpeed] = useState<number>(27);
  const [playerError, setPlayerError] = useState<boolean>(false);

  // Live timecode and simulated telemetry clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimecode(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      // Subtle speed fluctuations
      /* SPEED STATE UPDATE COMMENTED OUT PER USER REQUEST
      if (config.isBroadcasting) {
        setSpeed((prev) => {
          const delta = (Math.random() - 0.48) * 2;
          return Math.max(18, Math.min(36, Math.round(prev + delta)));
        });
      }
      */
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [config.isBroadcasting]);

  // Handle HLS or Native Video Playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (!config.isBroadcasting) {
      video.pause();
      return;
    }

    const streamUrl = config.streamUrl || (config.protocol === 'hls' ? TEST_HLS_URL : SAMPLE_STREAM_SRC);

    if (config.protocol === 'hls' && Hls.isSupported() && streamUrl.endsWith('.m3u8')) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((err) => {
          console.log('Autoplay deferred until user interaction', err);
        });
      });
      hls.on(Hls.Events.ERROR, () => {
        setPlayerError(true);
      });
    } else {
      // Standard MP4 or native iOS HLS (application/vnd.apple.mpegurl)
      video.src = streamUrl;
      video.load();
      video.play().catch(() => {
        // Expected if browser requires muted autoplay
        video.muted = true;
        setIsMuted(true);
        video.play().catch((e) => console.log('Autoplay prevented:', e));
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [config.isBroadcasting, config.protocol, config.streamUrl, isRefreshing]);

  // Render animated canvas HUD overlay for simulated driver camera feed
  useEffect(() => {
    if (!config.isBroadcasting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle dynamic noise / scanline effect for authentic telematics stream
      ctx.fillStyle = 'rgba(16, 185, 129, 0.015)';
      const yScan = (frame * 1.5) % canvas.height;
      ctx.fillRect(0, yScan, canvas.width, 2);

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [config.isBroadcasting]);

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Compute dynamic parent domains for Twitch Embed policy
  // Twitch requires ALL ancestor iframe domains in the hierarchy (including ai.studio and the current host)
  const getTwitchParentParams = () => {
    const hosts = new Set<string>();
    if (typeof window !== 'undefined') {
      if (window.location.hostname) hosts.add(window.location.hostname);
      try {
        if (document.referrer) {
          const refHost = new URL(document.referrer).hostname;
          if (refHost) hosts.add(refHost);
        }
      } catch (_) {}
    }
    hosts.add('ai.studio');
    hosts.add('aistudio.google.com');
    hosts.add('localhost');
    hosts.add('127.0.0.1');
    return Array.from(hosts).map((h) => `parent=${encodeURIComponent(h)}`).join('&');
  };

  const twitchChannel = config.twitchChannel || 'fraction32';
  const twitchParentParams = getTwitchParentParams();
  const twitchEmbedUrl = `https://player.twitch.tv/?channel=${encodeURIComponent(twitchChannel)}&${twitchParentParams}&autoplay=true&muted=false`;
  const twitchDirectUrl = `https://www.twitch.tv/${encodeURIComponent(twitchChannel)}`;

  return (
    <div
      ref={containerRef}
      id="video-stream-container"
      className="relative w-full aspect-video rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl shadow-black select-none group"
    >
      {/* Twitch Embedded Player or Standard Video/Canvas */}
      {config.protocol === 'twitch' ? (
        <div className="w-full h-full relative bg-slate-950 flex flex-col items-center justify-center">
          {config.isBroadcasting ? (
            <>
              <iframe
                id="twitch-embed-player"
                src={twitchEmbedUrl}
                height="100%"
                width="100%"
                allowFullScreen
                allow="autoplay; fullscreen"
                className="w-full h-full border-0 absolute inset-0 z-10"
                title="Live RTMP Twitch Broadcast"
              />
              
              {/* Fallback & Direct Tab link in case browser blocks 3rd-party iframe */}
              <div className="absolute top-2.5 right-2.5 z-20">
                <a
                  href={twitchDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white text-[10px] font-bold shadow-md backdrop-blur-xs transition-all active:scale-95"
                  title="Open Twitch Stream in new tab"
                >
                  <span>Open Twitch</span>
                  <Maximize2 className="w-2.5 h-2.5" />
                </a>
              </div>
            </>
          ) : (
            <div className="text-center p-4">
              <p className="text-slate-400 text-xs">Twitch RTMP Feed Inactive</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Actual Video Element configured with required attributes: autoplay, muted, playsinline */}
          <video
            ref={videoRef}
            id="live-transport-video"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              config.isBroadcasting ? 'opacity-90' : 'opacity-0'
            }`}
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
          />

          {/* Dynamic Canvas Telematics Layer */}
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70"
          />
        </>
      )}

      {/* TOP OVERLAYS (When broadcasting) */}
      {config.isBroadcasting && (
        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
          {/* Pulsing Live Badge in Video */}
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight shadow-xs pointer-events-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span>LIVE CAM 1</span>
          </div>

          {/* Timecode & Speed Indicator */}
          <div className="flex items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-white font-medium">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>{timecode || 'LIVE'}</span>
            </div>

            {/* SPEED INDICATOR OVERLAY COMMENTED OUT PER USER REQUEST
            <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-white font-bold">
              <Gauge className="w-3 h-3 text-emerald-400" />
              <span>{speed} km/h</span>
            </div>
            */}
          </div>
        </div>
      )}

      {/* BOTTOM OVERLAYS (When broadcasting) */}
      {config.isBroadcasting && config.protocol !== 'twitch' && (
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            {/* Unmute / Mute Toggle Button */}
            <button
              type="button"
              id="stream-mute-toggle-btn"
              onClick={toggleMute}
              className="h-7 px-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 backdrop-blur-md text-white flex items-center gap-1.5 text-xs font-semibold transition-colors"
              aria-label={isMuted ? 'Unmute stream' : 'Mute stream'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px]">Unmute</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px]">Audio On</span>
                </>
              )}
            </button>

            {/* Protocol Badge */}
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-700/60">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span>{config.protocol === 'twitch' ? 'RTMP (TWITCH)' : config.protocol.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Refresh Icon on player */}
            <button
              type="button"
              id="player-mini-refresh-btn"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-7 h-7 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 backdrop-blur-md text-white flex items-center justify-center transition-colors"
              aria-label="Refresh player stream"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              id="player-fullscreen-btn"
              onClick={toggleFullscreen}
              className="w-7 h-7 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 backdrop-blur-md text-white flex items-center justify-center transition-colors"
              aria-label="Toggle Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STREAM OFFLINE OVERLAY (Clean Minimalism styling) */}
      {!config.isBroadcasting && (
        <div 
          id="stream-offline-overlay"
          className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-6 z-30 select-none"
        >
          {/* Minimalist crossed circle icon matching theme */}
          <div className="w-12 h-12 border-2 border-slate-700 rounded-full flex items-center justify-center mb-3 relative">
            <div className="w-1 h-4 bg-slate-700 rotate-45 absolute rounded-full"></div>
            <div className="w-1 h-4 bg-slate-700 -rotate-45 absolute rounded-full"></div>
          </div>

          {/* Offline Headline */}
          <p className="text-slate-300 text-sm font-semibold tracking-tight">
            Stream is currently offline
          </p>

          {/* Explanatory Message */}
          <p className="text-slate-500 text-[11px] mt-1 italic max-w-xs mb-3.5">
            Driver has not started broadcasting
          </p>

          {/* Quick Action inside overlay */}
          <button
            type="button"
            id="offline-overlay-refresh-btn"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all active:scale-95"
          >
            <RotateCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isRefreshing ? 'Checking...' : 'Check Connection'}</span>
          </button>
        </div>
      )}

      {/* Reconnecting / Refreshing Banner Indicator */}
      {isRefreshing && config.isBroadcasting && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-40">
          <div className="bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-xs text-white shadow-xl">
            <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span className="font-medium">Refreshing WebRTC connection...</span>
          </div>
        </div>
      )}
    </div>
  );
};
