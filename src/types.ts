export interface AuthSession {
  authenticated: boolean;
  expiresAt: number; // Timestamp in milliseconds (7 days from login)
  lastLogin: number;
}

export interface DriverInfo {
  name: string;
  phone: string;
  vanNumber: string;
  licensePlate: string;
  route: string;
  schoolName: string;
  dispatchPhone: string;
}

export type StreamProtocol = 'webrtc' | 'hls' | 'twitch' | 'simulated';

export interface StreamConfig {
  isBroadcasting: boolean; // Driver broadcasting state
  protocol: StreamProtocol;
  streamUrl?: string;
  rtmpUrl?: string;
  rtmpServer?: string;
  streamKey?: string;
  twitchChannel?: string;
  fps: number;
  resolution: string;
  bitrate: string;
  latencyMs: number;
}

export interface VehicleLocation {
  lat: number;
  lon: number;
  speed: number;
  timestamp: number;
}
