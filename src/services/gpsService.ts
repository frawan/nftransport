import { VehicleLocation } from '../types';

export const VAN1_FIREBASE_ENDPOINT =
  'https://van-tracker-77a67-default-rtdb.asia-southeast1.firebasedatabase.app/van1.json';

/**
 * Fetch the latest live GPS position for Van 1 from Firebase RTDB
 */
export async function fetchVan1Location(): Promise<VehicleLocation | null> {
  try {
    const res = await fetch(`${VAN1_FIREBASE_ENDPOINT}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Firebase error: ${res.statusText}`);
    }

    const data = await res.json();
    if (data && typeof data.lat === 'number' && typeof data.lon === 'number') {
      return {
        lat: Number(data.lat),
        lon: Number(data.lon),
        speed: typeof data.speed === 'number' ? Math.max(0, Math.round(data.speed)) : 0,
        timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
      };
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch Van 1 GPS location:', err);
    return null;
  }
}

/**
 * Transmit driver GPS position to Firebase RTDB (matching driver.html)
 */
export async function sendVan1Location(
  lat: number,
  lon: number,
  speedKmh: number = 0
): Promise<{ success: boolean; error?: string }> {
  const payload: VehicleLocation = {
    lat,
    lon,
    speed: Math.max(0, Math.round(speedKmh)),
    timestamp: Date.now(),
  };

  try {
    const res = await fetch(VAN1_FIREBASE_ENDPOINT, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, error: `Firebase response: ${res.statusText}` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error transmitting GPS' };
  }
}

/**
 * Approximate human readable address or area using lightweight reverse geocoding with caching
 */
const addressCache = new Map<string, string>();

export async function getApproximateAddress(lat: number, lon: number): Promise<string> {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (addressCache.has(cacheKey)) {
    return addressCache.get(cacheKey)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const road = addr.road || addr.suburb || addr.neighbourhood || addr.city_district || '';
        const city = addr.city || addr.town || addr.county || '';
        const result = [road, city].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || 'Route Sector';
        addressCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (_) {
    // Ignore and fallback gracefully
  }

  return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
}

/**
 * Format timestamp into friendly relative time
 */
export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));

  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  return `${diffHour}h ago`;
}
