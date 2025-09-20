# lynx-chat

Tiny web demo showing AI-UX chat patterns:
- Streaming simulation (tokens appended over time)
- Citations drawer (toggle)
- Agent confirmation before sending
- Memory toggle (UX affordance only)

Why Lynx: This mirrors common AI-UX patterns you’d use with Lynx + ReactLynx on web. This scaffold uses Vite + React for a fast local preview. Swap in Lynx/ReactLynx web renderer when available in your environment.

Run
- npm i
- cd server && npm i && cd ..
- npm run dev  # runs web and server concurrently (Vite proxies /api to server)

Server
- Endpoint: POST /api/chat { messages: Array<{role:'user'|'assistant', content:string}> }
- Streaming: newline-delimited text chunks (text/plain; charset=utf-8)
- Rate limit: 10 req/min/IP (configurable via RATE_LIMIT_POINTS/RATE_LIMIT_DURATION)
- Fallback: if GEMINI_API_KEY missing, server returns 503 and streams demo chunks for UI

Env
- Create lynx-chat/.env

  GEMINI_API_KEY=<REPLACE_ME>
  # optional
  # PORT=8787
  # GEMINI_MODEL=gemini-1.5-flash
  # RATE_LIMIT_POINTS=10
  # RATE_LIMIT_DURATION=60

Trade-offs
- No real model or backend; streaming is simulated
- Minimal styling; focuses on UX behaviors
- Replace with real Lynx renderer/SDK if required
