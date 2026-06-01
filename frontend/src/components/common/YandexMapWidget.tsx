/**
 * YandexMapWidget — lightweight inline map showing a single point.
 *
 * Uses the Yandex Static Maps API (no DOM SDK required, no JS bundle, just an <img>).
 * Docs: https://yandex.ru/dev/staticapi/
 *
 * API key: set VITE_YANDEX_MAPS_API_KEY in .env
 * Replace "YOUR_YANDEX_MAPS_API_KEY_HERE" with your real key from https://developer.tech.yandex.ru/
 *
 * If no key is set the widget renders a branded placeholder linking to Yandex Maps.
 */
import React, { useState } from 'react';

const YANDEX_KEY = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';

interface Props {
  lat: number;
  lon: number;
  name: string;
  /** map width in px (default 460) */
  width?: number;
  /** map height in px (default 200) */
  height?: number;
}

export function YandexMapWidget({ lat, lon, name, width = 460, height = 200 }: Props) {
  const [imgError, setImgError] = useState(false);
  const hasKey = YANDEX_KEY && YANDEX_KEY !== 'YOUR_YANDEX_MAPS_API_KEY_HERE';

  // Fallback: clickable placeholder that opens Yandex Maps in new tab
  const yandexLink = `https://yandex.ru/maps/?pt=${lon},${lat}&z=15&l=map`;

  if (!hasKey || imgError) {
    return (
      <a href={yandexLink} target="_blank" rel="noopener noreferrer" title="Открыть на Яндекс.Картах"
        style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{
          width: '100%', height, borderRadius: 10, overflow: 'hidden',
          background: 'linear-gradient(135deg, #e8f4fd 0%, #d0e9f7 100%)',
          border: '0.5px solid #b3d4ef', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
        }}>
          <div style={{ fontSize: 28 }}>🗺️</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#185FA5' }}>{name}</div>
          <div style={{ fontSize: 11, color: '#888' }}>
            {lat.toFixed(4)}, {lon.toFixed(4)}
          </div>
          <div style={{ fontSize: 11, color: '#185FA5', textDecoration: 'underline' }}>
            Открыть на Яндекс.Картах →
          </div>
          {!hasKey && (
            <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>
              Установите VITE_YANDEX_MAPS_API_KEY для отображения карты
            </div>
          )}
        </div>
      </a>
    );
  }

  /**
   * Yandex Static Maps API endpoint:
   *   https://static-maps.yandex.ru/v1?apikey=KEY&ll=lon,lat&z=15&size=WxH&pt=lon,lat,pm2rdl
   *
   * Parameters:
   *   ll    — center (longitude,latitude)
   *   z     — zoom (1–19)
   *   size  — WIDTHxHEIGHT in pixels (max 650×450)
   *   pt    — point marker: lon,lat,STYLE  (pm2rdl = red large dot)
   *   l     — layer: map | sat | skl
   */
  const w = Math.min(width, 650);
  const h = Math.min(height, 450);
  const src =
    `https://static-maps.yandex.ru/v1` +
    `?apikey=${YANDEX_KEY}` +
    `&ll=${lon},${lat}` +
    `&z=15` +
    `&size=${w}x${h}` +
    `&pt=${lon},${lat},pm2rdl` +
    `&l=map`;

  return (
    <a href={yandexLink} target="_blank" rel="noopener noreferrer"
      title="Открыть на Яндекс.Картах" style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{ position: 'relative', width: '100%', height, borderRadius: 10, overflow: 'hidden',
        border: '0.5px solid #b3d4ef', cursor: 'pointer' }}>
        <img
          src={src}
          alt={`Карта: ${name}`}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* "Open in Yandex Maps" badge */}
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(255,255,255,0.92)',
          borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#185FA5', fontWeight: 600,
          border: '0.5px solid #b3d4ef', backdropFilter: 'blur(4px)' }}>
          Яндекс.Карты ↗
        </div>
      </div>
    </a>
  );
}
