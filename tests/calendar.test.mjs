import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarFile } from '../src/lib/calendar.mjs';

test('Korean local wedding time is converted to UTC in the calendar file', () => {
  const text = calendarFile({ date: '2027-05-15', time: '13:00', title: '예식', venue: '서울 예식장' });
  assert.match(text, /DTSTART:20270515T040000Z/);
  assert.match(text, /DTEND:20270515T060000Z/);
  assert.match(text, /LOCATION:서울 예식장/);
});

test('calendar text escapes commas, semicolons and newlines', () => {
  const text = calendarFile({ date: '2027-05-15', time: '13:00', title: '신랑,신부;예식\n초대', venue: '홀' });
  assert.match(text, /SUMMARY:신랑\\,신부\\;예식\\n초대/);
});
