export function classifySubmission(submitted, error) {
  if (error?.code === 'P0001') return 'capacity';
  if (error || submitted == null) return 'uncertain';
  return submitted ? 'accepted' : 'invalid-pass';
}

export async function removeUnsubmittedPhoto(remove, path, report = console.error) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { error } = await remove(path);
      if (!error) return true;
    } catch { /* Retry once before reporting the private orphan path. */ }
  }
  report(path);
  return false;
}

export async function resolveUncertainPhoto(lookup, path, report = console.error) {
  try {
    if (await lookup(path)) return true;
  } catch { /* Preserve the photo if the database cannot confirm the outcome. */ }
  report(path);
  return false;
}
