export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_PENDING = 100;
export const PHOTO_URL_TTL_SECONDS = 600;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** @param {string} input */
export function normalizeGuestCode(input) {
  const code = input.trim().toLowerCase();
  return /^[0-9a-f]{16}$/.test(code) ? code : '';
}

export function photoRefreshDelay(ttlSeconds) {
  return Math.max(1000, (ttlSeconds - 120) * 1000);
}

export function hasPendingCapacity(count) {
  return Number.isInteger(count) && count < MAX_PENDING;
}

/** @param {{ name: string, message: string, photo?: { type: string, size: number } | null }} input */
export function validateContribution({ name, message, photo }) {
  const cleanedName = name.trim();
  const cleanedMessage = message.trim();
  let error = '';
  if (!cleanedName || cleanedName.length > 20) error = '이름은 1~20자로 입력해 주세요.';
  else if (!cleanedMessage && !photo) error = '글 또는 사진을 추가해 주세요.';
  else if (cleanedMessage.length > 300) error = '글은 300자 이하로 입력해 주세요.';
  else if (photo && !PHOTO_TYPES.includes(photo.type)) error = '사진은 JPG, PNG, WebP만 올릴 수 있어요.';
  else if (photo && photo.size > MAX_PHOTO_BYTES) error = '사진은 5MB 이하로 올려 주세요.';
  return { name: cleanedName, message: cleanedMessage, error };
}

/** @param {Uint8Array} bytes */
export function detectImageType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)) return 'image/png';
  if (bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return '';
}

/** @param {Uint8Array} bytes */
export function stripJpegMetadata(bytes) {
  if (detectImageType(bytes) !== 'image/jpeg') throw new Error('사진 형식이 올바르지 않습니다.');
  const parts = [bytes.subarray(0, 2)];
  let offset = 2;
  while (offset < bytes.length) {
    const start = offset;
    if (bytes[offset++] !== 255) break;
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    if (marker === 0 || marker === 0xd8 || marker === 0xd9) break;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    const end = offset + length;
    if (length < 2 || end > bytes.length) break;
    if (marker === 0xda) {
      for (let index = end; index < bytes.length - 1; index++) {
        if (bytes[index] !== 255) continue;
        const next = bytes[index + 1];
        if ((next >= 0xe0 && next <= 0xef) || next === 0xfe) break;
        if (next !== 0xd9) continue;
        parts.push(bytes.subarray(start, index + 2));
        const sanitized = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
        let position = 0;
        for (const part of parts) { sanitized.set(part, position); position += part.length; }
        return sanitized;
      }
      break;
    }
    if (!((marker >= 0xe0 && marker <= 0xef) || marker === 0xfe)) parts.push(bytes.subarray(start, end));
    offset = end;
  }
  throw new Error('사진 형식이 올바르지 않습니다.');
}

/** @param {{ success?: boolean, hostname?: string, action?: string }} reply */
export function validChallenge(reply, origin) {
  try {
    return reply.success === true && reply.hostname === new URL(origin).hostname && reply.action === 'wedding-contribution';
  } catch {
    return false;
  }
}
