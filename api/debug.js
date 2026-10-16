export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const adminKey = process.env.ADMIN_KEY;
  return res.status(200).json({
    admin_key_exists: !!adminKey,
    admin_key_length: adminKey ? adminKey.length : 0,
    admin_key_first3: adminKey ? adminKey.slice(0,3) : null,
    env_keys: Object.keys(process.env).filter(k => k.startsWith('ADMIN') || k.startsWith('UPSTASH')),
  });
}
