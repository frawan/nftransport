import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  RotateCw, 
  Phone, 
  Lock, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { StreamPlayer } from './StreamPlayer';
import { CallDriverModal } from './CallDriverModal';
import { DriverStreamControls } from './DriverStreamControls';
import { LiveLocationMap } from './LiveLocationMap';
import { DriverTransmitterModal } from './DriverTransmitterModal';
import { StreamConfig, DriverInfo } from '../types';
import { formatSessionRemaining } from '../utils/storage';

interface StreamScreenProps {
  onLock: () => void;
  expiresAt: number;
}

const DEFAULT_DRIVER: DriverInfo = {
  name: 'Marcus Vance',
  phone: '(555) 382-9014',
  vanNumber: 'Van 1',
  licensePlate: 'TR-8921-SC',
  route: 'Route 4B - Morning Pickup',
  schoolName: 'Oakridge Academy',
  dispatchPhone: '(555) 800-7233',
};

export const StreamScreen: React.FC<StreamScreenProps> = ({ onLock, expiresAt }) => {
  const [streamConfig, setStreamConfig] = useState<StreamConfig>({
    isBroadcasting: true,
    protocol: 'twitch',
    twitchChannel: 'fraction32',
    fps: 30,
    resolution: '1080p',
    bitrate: '2.4 Mbps',
    latencyMs: 180,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showDriverTransmitter, setShowDriverTransmitter] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRefreshStream = () => {
    setIsRefreshing(true);
    showToast('Reconnecting transport stream...');
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Stream refreshed • Live WebRTC / RTMP active');
    }, 700);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 text-slate-900">
      <div className="w-full flex flex-col gap-4">
        
        {/* HEADER: Clean Minimalism styling */}
        <header className="w-full flex justify-between items-end pb-2 pt-1">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-blue-600 font-bold mb-1">
              Guardian Ride
            </p>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Van 1 - Live Transport Feed
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {streamConfig.isBroadcasting ? (
              <div 
                id="header-live-badge"
                className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full mb-0.5 border border-emerald-100/60"
              >
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
              </div>
            ) : (
              <div 
                id="header-offline-badge"
                className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full mb-0.5 border border-slate-200"
              >
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Offline</span>
              </div>
            )}

            {/* Driver GPS Transmitter button */}
            <button
              type="button"
              id="driver-transmitter-btn"
              onClick={() => setShowDriverTransmitter(true)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-blue-600 flex items-center justify-center transition-colors mb-0.5"
              title="Driver GPS Transmitter"
              aria-label="Driver GPS Transmitter"
            >
              <Navigation className="w-3.5 h-3.5" />
            </button>

            {/* Lock session button */}
            <button
              type="button"
              id="header-relock-btn"
              onClick={onLock}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors mb-0.5"
              title="Lock Session"
              aria-label="Lock Session"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* 16:9 RESPONSIVE VIDEO PLAYER CONTAINER */}
        <div className="w-full">
          <StreamPlayer
            config={streamConfig}
            onRefresh={handleRefreshStream}
            isRefreshing={isRefreshing}
          />
        </div>

        {/* REAL-TIME VEHICLE GPS TRACKING MAP (Powered by Firebase RTDB van1.json) */}
        <div className="w-full">
          <LiveLocationMap
            onOpenDriverPortal={() => setShowDriverTransmitter(true)}
          />
        </div>

        {/* METRICS & LOCATION CARDS COMMENTED OUT PER USER REQUEST:
            (Larix Broadcaster only transmits video/audio to Twitch without GPS telemetry.
             These mock placeholders are removed so parents only see real stream and route info.)
        <div className="w-full">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Next Scheduled Stop</p>
              <p className="text-sm font-bold text-slate-800 truncate">Lincoln High School</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>ETA ~4 mins</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-500/30">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-blue-500 uppercase font-bold mb-0.5">Last Seen Location</p>
            <p className="text-xs font-bold text-blue-950 truncate">Main St. Intersection &bull; 4 mins to dropoff</p>
          </div>
        </div>
        */}

        {/* DRIVER / BROADCASTER CONTROLS COMMENTED OUT SO PARENTS CANNOT SEE STREAM KEY OR CREDENTIALS:
        <div className="w-full">
          <DriverStreamControls
            config={streamConfig}
            onUpdateConfig={setStreamConfig}
          />
        </div>
        */}

        {/* 7-DAY REMEMBERED SESSION BANNER */}
        <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px]">PIN remembered on this device ({formatSessionRemaining(expiresAt)})</span>
          </div>
          <button
            type="button"
            onClick={onLock}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2 ml-2 shrink-0"
          >
            Lock Now
          </button>
        </div>

        {/* PRIMARY ACTION BUTTONS: Refresh Stream (Talking / Call Driver feature commented out per user request) */}
        <footer className="flex flex-col gap-3 pt-1">
          <button
            type="button"
            id="refresh-stream-main-btn"
            onClick={handleRefreshStream}
            disabled={isRefreshing}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-sm shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-slate-300'}`} />
            <span>{isRefreshing ? 'Refreshing Stream...' : 'Refresh Stream'}</span>
          </button>

          {/* TALKING / CALL DRIVER FEATURE COMMENTED OUT PER USER REQUEST:
          <button
            type="button"
            id="call-driver-main-btn"
            onClick={() => setShowCallModal(true)}
            className="w-full bg-white text-slate-900 border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xs"
          >
            <Phone className="w-4 h-4 text-slate-800" />
            <span>Call Driver</span>
          </button>
          */}
        </footer>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-6 inset-x-4 max-w-sm mx-auto z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* DRIVER GPS TRANSMITTER MODAL (Identical logic to driver.html) */}
      <DriverTransmitterModal
        isOpen={showDriverTransmitter}
        onClose={() => setShowDriverTransmitter(false)}
      />

      {/* TALKING / CALL DRIVER MODAL COMMENTED OUT PER USER REQUEST:
      <CallDriverModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        driver={DEFAULT_DRIVER}
      />
      */}
    </div>
  );
};

