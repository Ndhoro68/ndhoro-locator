import { kvSet } from '../lib/upstash.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  try {
    const body = req.body || {};
    const targetUrl = body.url;
    const ttl = parseInt(body.ttl || '900', 10);

    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
      return res.status(400).json({ error: 'invalid url' });
    }

    // token random
    const rand = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-6);
    const token = rand;

    const now = Math.floor(Date.now() / 1000);
    const exp = now + ttl;

    const payload = JSON.stringify({
      u: targetUrl,
      e: exp,
      created: now,
      used: 0,
    });

    const setRes = await kvSet(`tk:${token}`, payload, ttl);
    if (setRes && setRes.error) {
      return res.status(500).json({ error: 'kv set failed', detail: setRes.error });
    }

    const shortUrl = `${getBaseUrl(req)}/v/${token}`;

    return res.status(200).json({
      short: shortUrl,
      token: token,
      expires_at: exp,
      ttl_seconds: ttl,
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal', detail: String(err) });
  }
}

function getBaseUrl(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}
