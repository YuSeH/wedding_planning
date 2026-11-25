export function createTimedCache(ttlMs, now = Date.now) {
  let value;
  let expires = 0;
  let inFlight;
  return async load => {
    if (now() < expires) return value;
    if (!inFlight) {
      inFlight = Promise.resolve().then(load).then(result => {
        value = result;
        expires = now() + ttlMs;
        return result;
      }).finally(() => { inFlight = null; });
    }
    return inFlight;
  };
}
