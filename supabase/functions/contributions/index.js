import { createClient } from 'npm:@supabase/supabase-js@2.119.2';
import { hasPendingCapacity, normalizeGuestCode, stripJpegMetadata, validChallenge, validateContribution, MAX_PHOTO_BYTES, PHOTO_URL_TTL_SECONDS } from '../_shared/contributions.mjs';
import { readBoundedFormData } from '../_shared/form-data.mjs';
import { createTimedCache } from '../_shared/approved-cache.mjs';
import { classifySubmission, removeUnsubmittedPhoto, resolveUncertainPhoto } from '../_shared/submission-outcome.mjs';

const bucket = 'wedding-pending';
const maxFormBytes = MAX_PHOTO_BYTES + 1024 * 1024;
const approvedCache = createTimedCache(60_000);

Deno.serve(async request => {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = (Deno.env.get('SITE_ORIGINS') || '').split(',').map(value => value.trim());
  if (!allowedOrigins.includes(origin) || !origin) return new Response(null, { status: 403 });

  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
  const reply = (status, body, cache = false) => new Response(JSON.stringify(body), {
    status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', ...(cache ? { 'Cache-Control': 'public, max-age=60, s-maxage=60' } : {}) },
  });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const captchaSecret = Deno.env.get('TURNSTILE_SECRET');
  if (!url || !serviceKey || !captchaSecret) return reply(503, { error: '방명록 설정을 확인해 주세요.' });
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const discardPhoto = path => removeUnsubmittedPhoto(
    candidate => db.storage.from(bucket).remove([candidate]), path,
    candidate => console.error('wedding photo cleanup failed:', candidate),
  );
  const confirmPhoto = path => resolveUncertainPhoto(async candidate => {
    const { data, error } = await db.from('wedding_contributions').select('id').eq('photo_path', candidate).maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }, path, candidate => console.error('wedding photo submission uncertain:', candidate));

  try {
    if (request.method === 'GET') {
      const payload = await approvedCache(async () => {
        const { data, error } = await db.from('wedding_contributions')
          .select('id,name,message,photo_path,created_at')
          .eq('status', 'approved').order('created_at', { ascending: false }).limit(40);
        if (error) throw error;
        const entries = await Promise.all(data.map(async row => {
          const signed = row.photo_path
            ? await db.storage.from(bucket).createSignedUrl(row.photo_path, PHOTO_URL_TTL_SECONDS)
            : null;
          return {
            id: row.id, name: row.name, message: row.message, createdAt: row.created_at,
            photoUrl: signed?.data?.signedUrl || null,
          };
        }));
        return { entries };
      });
      return reply(200, payload, true);
    }
    if (request.method !== 'POST') return reply(405, { error: '지원하지 않는 요청입니다.' });
    if (Deno.env.get('SUBMISSIONS_ENABLED') !== 'true') return reply(503, { error: '방명록 접수를 준비 중입니다.' });
    if (Number(request.headers.get('content-length') || 0) > maxFormBytes) {
      return reply(413, { error: '사진은 5MB 이하로 올려 주세요.' });
    }
    let form;
    try { form = await readBoundedFormData(request, maxFormBytes); }
    catch (error) { return reply(error instanceof RangeError ? 413 : 400, { error: '요청 형식이나 사진 크기를 확인해 주세요.' }); }
    const input = form.get('photo');
    const photo = input instanceof File && input.name ? input : null;
    const { name, message, error } = validateContribution({
      name: String(form.get('name') || ''), message: String(form.get('message') || ''), photo,
    });
    if (error) return reply(400, { error });
    const guestCode = normalizeGuestCode(String(form.get('guest_code') || ''));
    if (!guestCode) return reply(400, { error: '16자리 초대 코드를 확인해 주세요.' });
    if (form.get('consent') !== 'yes') return reply(400, { error: '공개 동의가 필요합니다.' });
    const token = String(form.get('cf-turnstile-response') || '');
    if (!token) return reply(400, { error: '로봇 확인을 완료해 주세요.' });

    let imageBytes;
    if (photo) {
      imageBytes = new Uint8Array(await photo.arrayBuffer());
      if (photo.type !== 'image/jpeg' || imageBytes.length > MAX_PHOTO_BYTES) {
        return reply(400, { error: '사진 형식이나 크기를 확인해 주세요.' });
      }
      try { imageBytes = stripJpegMetadata(imageBytes); }
      catch { return reply(400, { error: '사진 형식이나 크기를 확인해 주세요.' }); }
    }

    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: captchaSecret, response: token }),
    });
    if (!verification.ok) return reply(503, { error: '로봇 확인 서비스에 연결하지 못했어요.' });
    if (!validChallenge(await verification.json(), origin)) return reply(400, { error: '로봇 확인을 다시 진행해 주세요.' });

    const { count: pending, error: countError } = await db.from('wedding_contributions')
      .select('id', { count: 'exact', head: true }).eq('status', 'pending');
    if (countError) throw countError;
    if (!hasPendingCapacity(pending)) return reply(429, { error: '현재 접수가 많아요. 운영자 확인 후 다시 이용해 주세요.' });
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(guestCode));
    const codeHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    const { data: pass, error: passError } = await db.from('wedding_guest_passes')
      .select('remaining').eq('code_hash', codeHash).gt('remaining', 0).maybeSingle();
    if (passError) throw passError;
    if (!pass) return reply(403, { error: '초대 코드가 올바르지 않거나 사용 횟수가 끝났어요.' });

    let photoPath = null;
    if (photo && imageBytes) {
      photoPath = `pending/${crypto.randomUUID()}.jpg`;
      try {
        const { error: uploadError } = await db.storage.from(bucket).upload(photoPath, imageBytes, {
          contentType: 'image/jpeg', upsert: false,
        });
        if (uploadError) throw uploadError;
      } catch {
        await discardPhoto(photoPath);
        return reply(503, { error: '사진 저장을 확인하지 못했어요. 운영자에게 문의해 주세요.' });
      }
    }
    let submitted = null;
    let insertError = null;
    try {
      ({ data: submitted, error: insertError } = await db.rpc('submit_wedding_contribution', {
        p_code_hash: codeHash, p_name: name, p_message: message, p_photo_path: photoPath,
      }));
    } catch {
      if (photoPath && await confirmPhoto(photoPath)) return reply(202, { ok: true });
      return reply(503, { error: '접수 여부를 확인할 수 없어요. 운영자에게 문의해 주세요.' });
    }
    const outcome = classifySubmission(submitted, insertError);
    if (outcome === 'accepted') return reply(202, { ok: true });
    if (outcome === 'uncertain') {
      if (photoPath && await confirmPhoto(photoPath)) return reply(202, { ok: true });
      return reply(503, { error: '접수 여부를 확인할 수 없어요. 운영자에게 문의해 주세요.' });
    }
    if (photoPath) await discardPhoto(photoPath);
    if (outcome === 'capacity') return reply(429, { error: '현재 접수가 많아요. 운영자 확인 후 다시 이용해 주세요.' });
    return reply(403, { error: '초대 코드가 올바르지 않거나 사용 횟수가 끝났어요.' });
  } catch {
    return reply(503, { error: '잠시 뒤 다시 시도해 주세요.' });
  }
});
