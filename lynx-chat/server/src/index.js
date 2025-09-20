import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { createGeminiStream } from './gemini.js';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 8787;

// Load dotenv from both server/.env and parent .env if present
const serverEnvPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(serverEnvPath)) dotenv.config({ path: serverEnvPath });
const parentEnvPath = path.resolve(process.cwd(), '..', '.env');
if (fs.existsSync(parentEnvPath)) dotenv.config({ path: parentEnvPath });

// CORS for local dev
app.use(cors({ origin: (origin, cb) => cb(null, true), credentials: true }));
app.use(express.json({ limit: '512kb' }));

// Basic health
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Rate limiting: 10 req/min/IP (configurable)
const points = Number(process.env.RATE_LIMIT_POINTS || 10);
const duration = Number(process.env.RATE_LIMIT_DURATION || 60);
const limiter = new RateLimiterMemory({ points, duration });

app.post('/api/chat', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  try {
    await limiter.consume(ip);
  } catch {
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  const body = req.body;
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    res.status(400).json({ error: 'invalid_request' });
    return;
  }

  // Streaming headers (chunked text)
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');

  const controller = new AbortController();
  req.on('close', () => controller.abort());

  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  if (!hasKey) {
    res.statusCode = 503;
    const fallback = [
      'Hi! Streaming demo…',
      'This is a fallback because no API key is set.',
      'You can still demo the UI behavior.'
    ];
    for (const line of fallback) {
      res.write(line + '\n');
      await new Promise(r => setTimeout(r, 300));
    }
    res.end();
    return;
  }

  try {
    const iterator = await createGeminiStream(body.messages, { signal: controller.signal });
    for await (const chunk of iterator) {
      res.write(chunk + '\n');
    }
    res.end();
  } catch (err) {
    // Keep recoverable UI
    if (!res.headersSent) res.status(500);
    res.write('An error occurred while streaming.');
    res.end();
  }
});

app.listen(port, () => {
  console.log(`lynx-chat server listening on http://localhost:${port}`);
});


