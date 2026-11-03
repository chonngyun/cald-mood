// Vercel serverless function: simpan/baca data mood di Upstash Redis (REST)
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOK = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const KEY = 'cald-mood';

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOK, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).result;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOK) return res.status(500).json({ error: 'Database belum terhubung' });
  const need = process.env.MOOD_TOKEN;
  if (need && req.headers['x-token'] !== need) return res.status(401).json({ error: 'unauthorized' });
  try {
    if (req.method === 'GET') {
      const v = await redis(['GET', KEY]);
      return res.status(200).json({ data: v ? JSON.parse(v) : {} });
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || typeof body.data !== 'object') return res.status(400).json({ error: 'bad body' });
      await redis(['SET', KEY, JSON.stringify(body.data)]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'method' });
  } catch (e) {
    return res.status(500).json({ error: 'server' });
  }
};
