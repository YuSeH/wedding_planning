function escapeText(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function utcStamp(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function calendarFile({ date, time, title, venue }) {
  const start = new Date(`${date}T${time}:00+09:00`);
  if (Number.isNaN(start.getTime())) throw new Error('날짜 또는 시간이 잘못되었습니다.');
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation Starter//KO',
    'BEGIN:VEVENT', `DTSTAMP:${utcStamp(new Date())}`, `DTSTART:${utcStamp(start)}`,
    `DTEND:${utcStamp(end)}`, `SUMMARY:${escapeText(title)}`,
    `LOCATION:${escapeText(venue)}`, 'END:VEVENT', 'END:VCALENDAR', ''
  ].join('\r\n');
}
