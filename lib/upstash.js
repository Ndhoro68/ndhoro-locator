// helper buat panggil Upstash REST API

export async function kvSet(key, value, ttlSec) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const cmd = ttlSec
    ? `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=${ttlSec}`
    : `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`;
  const r = await fetch(cmd, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.json();
}

export async function kvGet(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.json();
}

export async function kvDel(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const r = await fetch(`${url}/del/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.json();
}
