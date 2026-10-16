// GET /api/admin/list?key=<ADMIN_KEY>
// return daftar semua token (aktif + log yang udah dibuka)

import { kvGet } from '../../lib/upstash.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const key = req.query.key;
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    return res.status(500).json({ error: 'ADMIN_KEY belum di-set di Vercel' });
  }
  if (key !== adminKey) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    // scan semua key: tk:* (aktif) + log:* (udah dibuka)
    const allKeys = { active: [], logs: [] };

    for (const pattern of ['tk:*', 'log:*']) {
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
        if (pattern === 'tk:*') allKeys.active.push(...keys);
        else allKeys.logs.push(...keys);
        iter++;
        if (iter > 50) break; // safety
      } while (cursor !== '0');
    }

    // ambil value tiap key
    async function getValues(keys) {
      const out = [];
      for (const k of keys) {
        const r = await fetch(`${url}/get/${encodeURIComponent(k)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json();
        let data = null;
        try { data = JSON.parse(j.result); } catch (e) {}
        out.push({ key: k, data });
      }
      return out;
    }

    const active = await getValues(allKeys.active);
    const logs = await getValues(allKeys.logs);

    const baseHost = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host'] || req.headers.host}`;

    return res.status(200).json({
      now: Math.floor(Date.now() / 1000),
      active_count: active.length,
      log_count: logs.length,
      active: active.map(({ key, data }) => {
        const tok = key.replace('tk:', '');
        return {
          token: tok,
          url: `${baseHost}/v/${tok}`,
          target: data?.u || null,
          expires_at: data?.e || null,
          ttl_remaining: data?.e ? (data.e - Math.floor(Date.now() / 1000)) : null,
          created: data?.created || null,
        };
      }).sort((a, b) => (b.created || 0) - (a.created || 0)),
      logs: logs.map(({ key, data }) => {
        const tok = key.replace('log:', '');
        return {
          token: tok,
          target: data?.u || null,
          created: data?.created || null,
          used_at: data?.used_at || null,
        };
      }).sort((a, b) => (b.used_at || 0) - (a.used_at || 0)),
    });
  } catch (err) {
    return res.status(500).json({ error: 'internal', detail: String(err) });
  }
}
