import { ImageResponse } from 'next/og';
import { invitation } from '../../data/invitation';

export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f6f4ef', color: '#292723', fontSize: 48 }}>
      <div style={{ fontSize: 30, marginBottom: 32 }}>WEDDING INVITATION</div>
      <div>{invitation.couple}</div>
      <div style={{ display: 'flex', fontSize: 30, marginTop: 32 }}>{`${invitation.date} · ${invitation.time}`}</div>
    </div>,
    { width: 1200, height: 630 }
  );
}