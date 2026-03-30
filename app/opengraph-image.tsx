import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Mentoria — advisory at the intersection of sport, capital and leadership';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #19353E 0%, #1e4552 50%, #19353E 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
        }}
      >
        <div
          style={{
            fontSize: 82,
            fontWeight: 900,
            color: '#F7BC15',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          MENTORIA
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.82)',
            marginTop: 28,
            textAlign: 'center',
            maxWidth: 920,
            lineHeight: 1.35,
          }}
        >
          Sports, investment & executive education advisory
        </div>
      </div>
    ),
    { ...size },
  );
}
