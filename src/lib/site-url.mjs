export function siteUrl(env = process.env) {
  const configured = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return new URL(configured).href.replace(/\/$/, '');
  const vercelHost = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;
  return 'http://localhost:3000';
}
