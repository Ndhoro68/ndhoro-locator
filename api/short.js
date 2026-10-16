// POST /api/short
// body: { url: "https://xxx.ngrok-free.app", ttl: 900 }
// response: { short: "https://ndhoro-locator.vercel.app/v/<token>" }

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  try {
    const body = req.body || {};
    const targetUrl = body.url;
    const ttl = parseInt(body.ttl || '900', 10); // detik

    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) {
      return res.status(400).json({ error: 'invalid url' });
    }

    const exp = Math.floor(Date.now() / 1000) + ttl;
    const payload = JSON.stringify({ u: targetUrl, e: exp });
    const token = Buffer.from(payload).toString('base64url');

    const shortUrl = `${getBaseUrl(req)}/v/${token}`;

    return res.status(200).json({
      short: shortUrl,
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
