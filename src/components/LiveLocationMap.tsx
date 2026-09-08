import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Gauge,
  Clock,
  ExternalLink,
  RotateCw,
  Navigation,
  Compass,
  Wifi,
  WifiOff,
  Crosshair,
} from 'lucide-react';
import { VehicleLocation } from '../types';
import {
  fetchVan1Location,
  getApproximateAddress,
  formatRelativeTime,
} from '../services/gpsService';

interface LiveLocationMapProps {
  onOpenDriverPortal?: () => void;
}

export const LiveLocationMap: React.FC<LiveLocationMapProps> = ({
  onOpenDriverPortal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.CircleMarker | null>(null);

  const [location, setLocation] = useState<VehicleLocation | null>(null);
  const [address, setAddress] = useState<string>('Detecting location...');
  const [lastUpdated, setLastUpdated] = useState<string>('Syncing...');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Poll Firebase for live GPS coordinates
  const refreshLocation = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchVan1Location();
      if (data) {
        setLocation(data);
        setFetchError(null);

        // Check if GPS signal is fresh (within last 10 minutes)
        const isFresh = Date.now() - data.timestamp < 10 * 60 * 1000;
        setIsOnline(isFresh);
        setLastUpdated(formatRelativeTime(data.timestamp));

        // Fetch street/area address
        getApproximateAddress(data.lat, data.lon).then((addr) => {
          setAddress(addr);
        });
      } else {
        setFetchError('Waiting for driver GPS transmitter to broadcast...');
      }
    } catch (err: any) {
      setFetchError('Unable to sync live GPS data.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch and auto-polling every 4 seconds
  useEffect(() => {
    refreshLocation();
    const interval = setInterval(refreshLocation, 4000);
    return () => clearInterval(interval);
  }, [refreshLocation]);

  // Relative time counter update every 5 seconds
  useEffect(() => {
    const timeInterval = setInterval(() => {
      if (location) {
        setLastUpdated(formatRelativeTime(location.timestamp));
        const isFresh = Date.now() - location.timestamp < 10 * 60 * 1000;
        setIsOnline(isFresh);
      }
    }, 5000);
    return () => clearInterval(timeInterval);
  }, [location]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default initial coordinates (falls back to Lahore coordinates from Firebase or 0,0)
    const initialLat = location?.lat || 31.3877;
    const initialLon = location?.lon || 74.2049;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Subtle scale control
    L.control
      .zoom({
        position: 'bottomright',
      })
      .addTo(map);

    // Custom Van SVG Icon with glowing radar pulse
    const customVanIcon = L.divIcon({
      className: 'custom-van-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-blue-500 opacity-40"></span>
          <div class="relative w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const marker = L.marker([initialLat, initialLon], {
      icon: customVanIcon,
    }).addTo(map);

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update map marker and pan when location updates
  useEffect(() => {
    if (!mapInstanceRef.current || !location) return;

    const latLng: L.LatLngTuple = [location.lat, location.lon];

    if (markerRef.current) {
      markerRef.current.setLatLng(latLng);
    }

    // Smoothly pan to latest location
    mapInstanceRef.current.panTo(latLng, {
      animate: true,
      duration: 1,
    });
  }, [location]);

  // Recenter map button
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !location) return;
    mapInstanceRef.current.setView([location.lat, location.lon], 16, {
      animate: true,
    });
  };

  const googleMapsUrl = location
    ? `https://www.google.com/maps?q=${location.lat},${location.lon}`
    : '#';

  return (
    <div
      id="live-gps-tracking-card"
      className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col transition-all"
    >
      {/* CARD HEADER */}
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-900 tracking-tight">Live Vehicle Location</h3>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE GPS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  STANDBY
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">{address}</p>
          </div>
        </div>

        {/* REFRESH & GOOGLE MAPS SHORTCUT */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={refreshLocation}
            disabled={isRefreshing}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors active:scale-95"
            title="Refresh GPS location"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {location && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-[10px] transition-all active:scale-95"
              title="Open coordinates in Google Maps"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* MAP CONTAINER */}
      <div className="relative w-full h-56 sm:h-64 bg-slate-100 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* FLOATING CONTROLS & TELEMETRY OVERLAY */}
        {location && (
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none flex flex-col gap-1.5">
            {/* Speed Badge */}
            <div className="pointer-events-auto inline-flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1 rounded-xl text-[11px] font-mono shadow-md border border-slate-700/50">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">{location.speed}</span>
              <span className="text-[9px] text-slate-300">km/h</span>
            </div>
          </div>
        )}

        {/* Recenter Button */}
        <button
          type="button"
          onClick={handleRecenter}
          className="absolute bottom-2.5 left-2.5 z-10 p-2 rounded-xl bg-white/95 backdrop-blur-md text-slate-700 shadow-md border border-slate-200/80 hover:bg-slate-50 transition-all active:scale-95"
          title="Recenter to van"
        >
          <Crosshair className="w-4 h-4 text-blue-600" />
        </button>

        {/* Signal indicator bottom right */}
        <div className="absolute bottom-2.5 right-12 z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md text-slate-600 px-2 py-0.5 rounded-lg text-[9px] font-mono border border-slate-200 shadow-xs flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-slate-400" />
            <span>Updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* FOOTER TELEMETRY STRIP */}
      <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
          <span>
            LAT: <strong className="text-slate-800">{location ? location.lat.toFixed(4) : '--'}</strong>
          </span>
          <span>
            LON: <strong className="text-slate-800">{location ? location.lon.toFixed(4) : '--'}</strong>
          </span>
        </div>

        {/* Driver Transmitter Quick Link */}
        {onOpenDriverPortal && (
          <button
            type="button"
            onClick={onOpenDriverPortal}
            className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            <Navigation className="w-3 h-3 text-blue-500" />
            <span>Driver GPS Transmitter</span>
          </button>
        )}
      </div>
    </div>
  );
};
