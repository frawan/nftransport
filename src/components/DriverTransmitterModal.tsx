import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  X,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Gauge,
  Clock,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { VAN1_FIREBASE_ENDPOINT, sendVan1Location } from '../services/gpsService';

interface DriverTransmitterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverTransmitterModal: React.FC<DriverTransmitterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [statusText, setStatusText] = useState('Tap Start Route to begin transmitting live GPS.');
  const [lastSentTime, setLastSentTime] = useState<string | null>(null);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLon, setCurrentLon] = useState<number | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Stop tracking on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  const handleStartTracking = async () => {
    if (!('geolocation' in navigator)) {
      setErrorMessage('Geolocation is not supported on this device/browser.');
      return;
    }

    setErrorMessage(null);

    // Request Wake Lock so mobile screen stays awake during the route
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setWakeLockActive(true);
      }
    } catch (_) {
      // WakeLock optional
    }

    try {
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const speedKmh = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0;
          const acc = position.coords.accuracy ? Math.round(position.coords.accuracy) : null;

          setCurrentLat(lat);
          setCurrentLon(lon);
          setCurrentSpeed(speedKmh);
          setAccuracy(acc);

          const result = await sendVan1Location(lat, lon, speedKmh);
          if (result.success) {
            setLastSentTime(new Date().toLocaleTimeString());
            setStatusText(`Transmitting live to Firebase (${speedKmh} km/h)`);
            setErrorMessage(null);
          } else {
            setErrorMessage(result.error || 'Failed to update Firebase RTDB');
          }
        },
        (error) => {
          setErrorMessage(`GPS Error: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );

      watchIdRef.current = id;
      setIsTracking(true);
      setStatusText('GPS signal acquired. Transmitting coordinates...');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start GPS tracking.');
    }
  };

  const handleStopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
    setIsTracking(false);
    setStatusText('Transmitter paused.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Van 1 Driver GPS Transmitter</h3>
              <p className="text-[10px] text-slate-400 font-mono">Firebase RTDB /van1.json</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="p-5 flex flex-col gap-4">
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            {isTracking ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                TRANSMITTING LIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                GPS INACTIVE
              </span>
            )}
          </div>

          <p className="text-center text-xs text-slate-600">
            Keep this screen open on the driver's phone while on route to broadcast live vehicle location to parents.
          </p>

          {/* Telemetry Display */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col gap-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Status:</span>
              <span className="text-slate-800 font-semibold truncate text-[11px]">{statusText}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Coordinates:</span>
              <span className="text-slate-800 font-bold">
                {currentLat && currentLon ? `${currentLat.toFixed(5)}, ${currentLon.toFixed(5)}` : '--, --'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[10px] uppercase font-bold">Speed:</span>
              <span className="text-emerald-700 font-bold">{currentSpeed} km/h</span>
            </div>
            {accuracy !== null && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px] uppercase font-bold">GPS Accuracy:</span>
                <span className="text-slate-700">±{accuracy} meters</span>
              </div>
            )}
            {lastSentTime && (
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-2">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Last Transmitted:</span>
                <span className="text-blue-600 font-bold">{lastSentTime}</span>
              </div>
            )}
          </div>

          {/* Error notice if any */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="truncate">{errorMessage}</span>
            </div>
          )}

          {/* Primary Action Button */}
          {isTracking ? (
            <button
              type="button"
              onClick={handleStopTracking}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md shadow-red-600/20 transition-all"
            >
              STOP ROUTE
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartTracking}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4" />
              <span>START ROUTE</span>
            </button>
          )}

          {/* Wake Lock & Background Tips */}
          <div className="flex items-center gap-2 text-[10px] text-slate-400 bg-slate-100/80 p-2.5 rounded-xl">
            <Smartphone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>
              {wakeLockActive
                ? 'Screen Wake-Lock active. Phone will not sleep.'
                : 'Screen Wake-Lock will activate once started to maintain GPS.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
