// GET /api/admin/clear?key=<ADMIN_KEY>
// hapus SEMUA log:* dan tk:* di Redis

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const key = req.query.key;
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) return res.status(500).json({ error: 'ADMIN_KEY belum di-set' });
  if (key !== adminKey) return res.status(401).json({ error: 'unauthorized' });

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    let deleted = 0;
    const patterns = ['tk:*', 'log:*'];

    for (const pattern of patterns) {
      let cursor = '0';
      let iter = 0;
      do {
        const r = await fetch(`${url}/scan/${cursor}/match/${encodeURIComponent(pattern)}/count/100`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json();
        if (j.error) break;

        const [newCursor, keys] = j.result || ['0', []];
        cursor = newCursor;

        if (keys.length > 0) {
          // delete satu-satu
          for (const k of keys) {
            await fetch(`${url}/del/${encodeURIComponent(k)}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            deleted++;
          }
        }
        iter++;
        if (iter > 100) break;
      } while (cursor !== '0');
    }

    return res.status(200).json({ ok: true, deleted });
  } catch (err) {
    return res.status(500).json({ error: 'internal', detail: String(err) });
  }
}
