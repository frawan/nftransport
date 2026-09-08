import { AuthSession } from '../types';

export const AUTH_STORAGE_KEY = 'school_transport_van1_auth';
export const DEFAULT_PIN = '1234';
export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    
    // Check if session is valid and not expired
    if (session && session.authenticated && typeof session.expiresAt === 'number') {
      if (Date.now() < session.expiresAt) {
        return session;
      } else {
        // Expired after 7 days
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }
    }
    return null;
  } catch (err) {
    console.warn('Failed to read auth session from localStorage', err);
    return null;
  }
}

export function saveAuthSession(): AuthSession {
  const session: AuthSession = {
    authenticated: true,
    expiresAt: Date.now() + SEVEN_DAYS_MS,
    lastLogin: Date.now(),
  };
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('Failed to persist auth session to localStorage', err);
  }
  return session;
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear auth session', err);
  }
}

export function formatSessionRemaining(expiresAt: number): string {
  const diffMs = expiresAt - Date.now();
  if (diffMs <= 0) return 'Expired';
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }
  return `${hours}h remaining`;
}
