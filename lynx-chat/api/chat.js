import { GoogleGenerativeAI } from '@google/generative-ai';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const points = Number(process.env.RATE_LIMIT_POINTS || 10);
const duration = Number(process.env.RATE_LIMIT_DURATION || 60);
const limiter = new RateLimiterMemory({ points, duration });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  try {
    await limiter.consume(ip);
  } catch {
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');

  if (!process.env.GEMINI_API_KEY) {
    res.statusCode = 503;
    const fallback = [
      'Hi! Streaming demo…',
      'This is a fallback because no API key is set.',
      'You can still demo the UI behavior.'
    ];
    for (const line of fallback) {
      res.write(line + '\n');
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 300));
    }
    res.end();
    return;
  }

  try {
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const model = client.getGenerativeModel({ model: modelName });

    const prompt = findLastUserMessage(body.messages) || 'Hello!';
    const result = await model.generateContentStream({ contents: [{ role: 'user', parts: [{ text: prompt }] }], safetySettings: [] });

    for await (const item of result.stream) {
      const text = item?.text?.();
      if (text) res.write(text + '\n');
    }
    res.end();
  } catch (err) {
    if (!res.headersSent) res.status(500);
    res.write('An error occurred while streaming.');
    res.end();
  }
}

function findLastUserMessage(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m && m.role === 'user' && typeof m.content === 'string' && m.content.trim()) return m.content;
  }
  return '';
}

function safeParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}


