'use client';

import Script from 'next/script';
import { useEffect, useState, type FormEvent } from 'react';
import { MAX_PHOTO_BYTES, PHOTO_URL_TTL_SECONDS, normalizeGuestCode, photoRefreshDelay, validateContribution } from '../../supabase/functions/_shared/contributions.mjs';

type Entry = { id: string; name: string; message: string; createdAt: string; photoUrl: string | null };

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') || '';
const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
const endpoint = projectUrl ? `${projectUrl}/functions/v1/contributions` : '';
const ready = projectUrl.startsWith('https://') && Boolean(apiKey && siteKey) && process.env.NEXT_PUBLIC_SUBMISSIONS_ENABLED === 'true';

declare global {
  interface Window { turnstile?: { reset: () => void } }
}

async function preparePhoto(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error('원본 사진은 10MB 이하로 선택해 주세요.');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('사진은 JPG, PNG, WebP만 올릴 수 있어요.');
  const image = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext('2d');
  if (!context) { image.close(); throw new Error('이 브라우저에서 사진을 처리할 수 없어요.'); }
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', .85));
  if (!blob || blob.size > MAX_PHOTO_BYTES) throw new Error('사진을 5MB 이하로 줄여 다시 선택해 주세요.');
  return new File([blob], 'guest-photo.jpg', { type: 'image/jpeg' });
}

export default function Contributions() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(ready);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    const load = () => fetch(endpoint, { headers: { apikey: apiKey }, signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('load failed');
        const data = await response.json();
        setEntries(data.entries);
        setLoadError(false);
      })
      .catch(() => { if (!controller.signal.aborted) setLoadError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    load();
    const interval = window.setInterval(load, photoRefreshDelay(PHOTO_URL_TTL_SECONDS));
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { controller.abort(); window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const selected = data.get('photo');
    const photo = selected instanceof File && selected.name ? selected : null;
    const guestCode = normalizeGuestCode(String(data.get('guest_code') || ''));
    if (!guestCode) { setStatus('16자리 초대 코드를 확인해 주세요.'); return; }
    if (data.get('consent') !== 'yes') { setStatus('공개 및 사진 제출 안내에 동의해 주세요.'); return; }
    if (!data.get('cf-turnstile-response')) { setStatus('로봇 확인을 완료해 주세요.'); return; }
    setSubmitting(true);
    setStatus('접수하고 있어요…');
    try {
      const processedPhoto = photo ? await preparePhoto(photo) : null;
      const result = validateContribution({ name: String(data.get('name') || ''), message: String(data.get('message') || ''), photo: processedPhoto });
      if (result.error) throw new Error(result.error);
      data.set('guest_code', guestCode);
      data.set('name', result.name);
      data.set('message', result.message);
      if (processedPhoto) data.set('photo', processedPhoto);
      else data.delete('photo');
      const response = await fetch(endpoint, { method: 'POST', headers: { apikey: apiKey }, body: data });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || '접수하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
      form.reset();
      window.turnstile?.reset();
      setStatus('접수됐어요. 운영자 확인 후 공개됩니다.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '접수하지 못했어요.');
      window.turnstile?.reset();
    } finally {
      setSubmitting(false);
    }
  }

  return <section className="contributions" aria-labelledby="guestbook-title">
    <p className="section-kicker">04 <span /> GUESTBOOK & PHOTOS</p>
    <h2 id="guestbook-title">방명록과 사진</h2>
    <p className="contribution-intro">축하의 말이나 함께한 사진을 남겨 주세요.<br />운영자가 확인한 뒤 이곳에 공개됩니다.</p>
    {!ready ? <p className="setup-note" role="status">방명록과 사진을 준비 중입니다. 지금은 글과 사진을 받지 않습니다.</p> : <>
      <form className="contribution-form" onSubmit={submit}>
        <label>하객 초대 코드 <input name="guest_code" type="text" maxLength={16} minLength={16} required autoComplete="off" spellCheck={false} placeholder="전달받은 16자리 코드" /></label>
        <label>이름 또는 별명 <input name="name" type="text" maxLength={20} required autoComplete="name" /></label>
        <label>축하의 말 <textarea name="message" maxLength={300} rows={4} placeholder="사진만 올려도 좋아요." /></label>
        <label>사진 한 장 (선택) <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
        <p className="privacy-note">사진은 기기에서 다시 저장해 위치 정보 등을 줄여 접수합니다. 타인이 나온 사진은 동의, 미성년자가 나온 사진은 보호자 동의를 확인해 주세요. 전화번호·주소 같은 개인정보는 적지 마세요.</p>
        <label className="consent"><input name="consent" type="checkbox" value="yes" required /> 승인되면 입력한 이름·글·사진이 이 사이트에 공개되는 데 동의합니다.</label>
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
        <div className="cf-turnstile" data-sitekey={siteKey} data-action="wedding-contribution" data-size="compact" data-theme="light" />
        <button type="submit" disabled={submitting}>{submitting ? '접수 중…' : '축하의 마음 남기기'}</button>
        {status && <p className="contribution-status" role="status">{status}</p>}
      </form>
      <div className="contribution-list" aria-live="polite">
        {loading ? <p>축하 글을 불러오는 중이에요…</p> : loadError ? <p>축하 글을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p> : entries.length === 0 ? <p>아직 공개된 축하 글이 없어요.</p> : entries.map(entry => <article className="contribution-card" key={entry.id}>
          {entry.photoUrl && <img src={entry.photoUrl} alt={`${entry.name}님이 올린 사진`} loading="lazy" referrerPolicy="no-referrer" />}
          {entry.message && <p>{entry.message}</p>}
          <div><strong>{entry.name}</strong><time dateTime={entry.createdAt}>{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(entry.createdAt))}</time></div>
        </article>)}
      </div>
    </>}
  </section>;
}
