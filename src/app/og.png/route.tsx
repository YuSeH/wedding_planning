import { ImageResponse } from 'next/og';
import { invitation } from '../../data/invitation';

export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', padding: 34, background: '#f0eee5', color: '#323a31' }}>
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #c9c9bb', padding: '43px 55px' }}>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', color: '#5e6857', fontSize: 17, letterSpacing: 5 }}>
          <span>THE WEDDING OF</span><span>{invitation.date.replaceAll('-', ' · ')}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 22, letterSpacing: 7, color: '#788271', marginBottom: 31 }}>WEDDING INVITATION</div>
          <div style={{ fontSize: 65, fontWeight: 500 }}>{invitation.couple}</div>
          <div style={{ display: 'flex', width: 92, height: 1, background: '#aab4a1', margin: '33px 0' }} />
          <div style={{ fontSize: 25, color: '#52634f' }}>{`${invitation.date} · ${invitation.time}`}</div>
        </div>
        <div style={{ fontSize: 18, letterSpacing: 3, color: '#788271' }}>WITH LOVE</div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  );
}