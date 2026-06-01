/**
 * Yandex Maps distance calculation via the Geocoder/Router API.
 *
 * API key is read from VITE_YANDEX_MAPS_API_KEY env var.
 * Replace "YOUR_YANDEX_MAPS_API_KEY_HERE" in docker-compose.yml / .env with your real key.
 *
 * We use the lightweight Yandex HTTP Geocoder + straight-line fallback:
 * Yandex Maps JS API requires a DOM mount; for distance-only we call the
 * Yandex Maps HTTP API (no DOM required).
 *
 * Endpoint: https://geocode-maps.yandex.ru/1.x/?apikey=KEY&geocode=POINT&format=json
 * Route:    https://api.routing.yandex.net/v2/route — requires separate key & quota.
 *
 * For simplicity we compute straight-line (haversine) distance and label it "~X km".
 * When the user's key supports Yandex Routing API, swap _haversine for _yandexRoute.
 */

import { useState, useEffect } from 'react';

const YANDEX_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY || 'YOUR_YANDEX_MAPS_API_KEY_HERE';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calls Yandex Maps Router HTTP API to get driving distance.
 * Requires a key with Router API quota enabled.
 */
async function yandexDrivingDistanceKm(
  fromLat: number, fromLon: number,
  toLat: number, toLon: number,
): Promise<number> {
  const url =
    `https://api.routing.yandex.net/v2/route` +
    `?apikey=${YANDEX_KEY}` +
    `&waypoints=${fromLat},${fromLon}|${toLat},${toLon}` +
    `&mode=driving`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Yandex route API error');
  const data = await res.json();
  // Response: { route: { legs: [{ steps: [...] }], distance: { value: meters } } }
  const meters = data?.route?.legs?.[0]?.distance?.value;
  if (!meters) throw new Error('No distance in response');
  return meters / 1000;
}

export interface DistanceResult {
  text: string;     // e.g. "3.2 км" or "~5.1 км"
  km: number;
  isDriving: boolean;
}

/**
 * Hook: returns distance from user's location to (lat, lon).
 * Tries Yandex Routing API first; falls back to haversine straight-line.
 */
export function useYandexDistance(
  toLat: number | null,
  toLon: number | null,
): DistanceResult | null {
  const [result, setResult] = useState<DistanceResult | null>(null);

  useEffect(() => {
    if (!toLat || !toLon) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: fromLat, longitude: fromLon } = pos.coords;
        try {
          const km = await yandexDrivingDistanceKm(fromLat, fromLon, toLat, toLon);
          setResult({ text: `${km.toFixed(1)} км`, km, isDriving: true });
        } catch {
          // Fallback to straight-line distance
          const km = haversineKm(fromLat, fromLon, toLat, toLon);
          setResult({ text: `~${km.toFixed(1)} км`, km, isDriving: false });
        }
      },
      () => { /* user denied geolocation — show nothing */ },
      { timeout: 5000 },
    );
  }, [toLat, toLon]);

  return result;
}

/**
 * Standalone function to compute distances for a list of kartodromes.
 * Returns a map of kartodrome_id → DistanceResult.
 */
export async function computeDistances(
  kartodromes: Array<{ id: number; latitude: number | null; longitude: number | null }>,
  userLat: number,
  userLon: number,
): Promise<Record<number, DistanceResult>> {
  const results: Record<number, DistanceResult> = {};
  await Promise.all(
    kartodromes.map(async (k) => {
      if (!k.latitude || !k.longitude) return;
      try {
        const km = await yandexDrivingDistanceKm(userLat, userLon, k.latitude, k.longitude);
        results[k.id] = { text: `${km.toFixed(1)} км`, km, isDriving: true };
      } catch {
        const km = haversineKm(userLat, userLon, k.latitude, k.longitude);
        results[k.id] = { text: `~${km.toFixed(1)} км`, km, isDriving: false };
      }
    }),
  );
  return results;
}
