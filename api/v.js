import { kvGet, kvSet, kvDel } from '../lib/upstash.js';

export default async function handler(req, res) {
  const token = req.query.t;
  if (!token) return res.status(400).send('no token');

  try {
    const getRes = await kvGet(`tk:${token}`);
    const raw = getRes && getRes.result;

    if (!raw) {
      return res.status(410).send(expiredHtml('Link tidak ditemukan atau sudah kadaluarsa.'));
    }

    const data = JSON.parse(raw);
    const now = Math.floor(Date.now() / 1000);

    if (now > data.e) {
      return res.status(410).send(expiredHtml('Link sudah kadaluarsa.'));
    }

    const usedPayload = JSON.stringify({
      u: data.u,
      e: data.e,
      created: data.created,
      used_at: now,
    });

    // simpen log 7 hari
    await kvSet(`log:${token}`, usedPayload, 604800);

    // hapus token → one-time
    await kvDel(`tk:${token}`);

    return res.redirect(302, data.u);
  } catch (err) {
    return res.status(400).send('invalid token: ' + String(err));
  }
}

function expiredHtml(msg) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Link expired</title></head>
  <body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#0b0e14;color:#e8edf5">
  <h2>Link tidak tersedia</h2>
  <p style="color:#94a3b8">${msg}</p>
  </body></html>`;
}
