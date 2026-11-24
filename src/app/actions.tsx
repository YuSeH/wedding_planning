'use client';

import { useState } from 'react';
import { calendarFile } from '../lib/calendar.mjs';

type Details = { couple: string; date: string; time: string; venue: string; hall: string };

export default function Actions({ details }: { details: Details }) {
  const [message, setMessage] = useState('');

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${details.couple} 결혼식에 초대합니다`, url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage('청첩장 주소를 복사했어요.');
    } catch {
      setMessage('주소 복사가 안 되면 브라우저 주소창의 링크를 복사해 주세요.');
    }
  }

  function saveCalendar() {
    const content = calendarFile({
      date: details.date, time: details.time,
      title: `${details.couple} 결혼식`, venue: `${details.venue} ${details.hall}`,
    });
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'wedding.ics';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="actions">
    <button type="button" onClick={share}>청첩장 공유 / 링크 복사</button>
    <button type="button" onClick={saveCalendar}>캘린더에 저장</button>
    {message && <p role="status" className="status">{message}</p>}
  </div>;
}
