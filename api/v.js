// GET /api/v?t=<token>
export default async function handler(req, res) {
  const token = req.query.t;
  if (!token) {
    return res.status(400).send('no token');
  }

  try {
    const json = Buffer.from(token, 'base64url').toString('utf-8');
    const data = JSON.parse(json);

    if (!data.u || !data.e) {
      return res.status(400).send('invalid token');
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > data.e) {
      return res.status(410).send(`
        <!DOCTYPE html><html><head><meta charset="utf-8">
        <title>Link expired</title></head><body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#0b0e14;color:#e8edf5">
        <h2>Link sudah kadaluarsa</h2>
        <p style="color:#94a3b8">Link ini hanya berlaku sekali / dalam waktu terbatas.</p>
        </body></html>
      `);
    }

    return res.redirect(302, data.u);
  } catch (err) {
    return res.status(400).send('invalid token');
  }
}
