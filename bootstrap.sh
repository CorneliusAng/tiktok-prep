#!/usr/bin/env bash
set -euo pipefail

# Scaffold monorepo: tiktok-prep
# - sandboxes/js-katas: node --test katas with watch
# - sandboxes/react-katas: Vite + React (JS) with cancelable fetch, virtualization, a11y
# - lynx-chat: tiny web demo of AI-UX chat patterns (streaming, citations, confirmation, memory)

ROOT_DIR="tiktok-prep"

# Allow running either from parent dir (to create tiktok-prep) or within tiktok-prep
if [ "$(basename "$PWD")" = "$ROOT_DIR" ]; then
  echo "Scaffolding into existing $(pwd)"
else
  if [ -e "$ROOT_DIR" ]; then
    echo "Error: '$ROOT_DIR' already exists in $(pwd). Remove it or run inside it."
    exit 1
  fi
  mkdir -p "$ROOT_DIR"
  cd "$ROOT_DIR"
fi

# Root README
cat > README.md <<'EOF'
# tiktok-prep

Three parts for fast prep loops:
- lynx-chat/: a tiny web demo showing AI-UX chat patterns (streaming, citations, confirmation, memory toggle).
- sandboxes/js-katas/: pure JS katas runnable with node --test.
- sandboxes/react-katas/: a Vite + React sandbox for component drills (effects, cancelable fetch, virtualization, a11y).

Quickstart
- JS katas: cd sandboxes/js-katas && npm i && npm test
- React katas: cd sandboxes/react-katas && npm i && npm run dev
- Lynx chat: cd lynx-chat && npm i && npm run dev
EOF

# 1) sandboxes/js-katas
mkdir -p sandboxes/js-katas/src sandboxes/js-katas/test
cat > sandboxes/js-katas/package.json <<'EOF'
{
  "name": "js-katas",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "watch": "nodemon --watch src --watch test --exec node --test"
  },
  "devDependencies": {
    "nodemon": "3.1.7"
  }
}
EOF

cat > sandboxes/js-katas/src/katas.js <<'EOF'
export function mapPolyfill(array, callback, thisArg) {
  if (!Array.isArray(array)) throw new TypeError('mapPolyfill expects an array');
  if (typeof callback !== 'function') throw new TypeError('callback must be a function');
  const result = new Array(array.length);
  for (let i = 0; i < array.length; i++) {
    if (i in array) {
      result[i] = callback.call(thisArg, array[i], i, array);
    }
  }
  return result;
}

export function filterPolyfill(array, predicate, thisArg) {
  if (!Array.isArray(array)) throw new TypeError('filterPolyfill expects an array');
  if (typeof predicate !== 'function') throw new TypeError('predicate must be a function');
  const result = [];
  for (let i = 0; i < array.length; i++) {
    if (i in array) {
      const val = array[i];
      if (predicate.call(thisArg, val, i, array)) result.push(val);
    }
  }
  return result;
}

export function reducePolyfill(array, reducer, initialValue) {
  if (!Array.isArray(array)) throw new TypeError('reducePolyfill expects an array');
  if (typeof reducer !== 'function') throw new TypeError('reducer must be a function');
  let hasInit = arguments.length >= 3;
  let acc = initialValue;
  let i = 0;

  if (!hasInit) {
    while (i < array.length && !(i in array)) i++;
    if (i >= array.length) throw new TypeError('Reduce of empty array with no initial value');
    acc = array[i++];
  }

  for (; i < array.length; i++) {
    if (i in array) acc = reducer(acc, array[i], i, array);
  }
  return acc;
}

export function debounce(fn, waitMs = 0) {
  if (typeof fn !== 'function') throw new TypeError('fn must be a function');
  let timer = null;
  return function debounced(...args) {
    const ctx = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(ctx, args);
    }, waitMs);
  };
}

export function throttle(fn, intervalMs = 0) {
  if (typeof fn !== 'function') throw new TypeError('fn must be a function');
  let last = 0;
  return function throttled(...args) {
    const now = Date.now();
    if (now - last >= intervalMs) {
      last = now;
      return fn.apply(this, args);
    }
  };
}

export async function fetchWithRetry(url, options = {}, retries = 3, backoffMs = 150) {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && (res.status === 429 || res.status >= 500)) {
        if (attempt >= retries) return res;
        await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
        attempt++;
        continue;
      }
      return res;
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise(r => setTimeout(r, backoffMs * Math.pow(2, attempt)));
      attempt++;
    }
  }
}

export function lruFactory(capacity) {
  if (!Number.isInteger(capacity) || capacity <= 0) throw new TypeError('capacity must be a positive integer');
  const map = new Map();
  return {
    set(key, value) {
      if (map.has(key)) map.delete(key);
      map.set(key, value);
      if (map.size > capacity) {
        const oldestKey = map.keys().next().value;
        map.delete(oldestKey);
      }
    },
    get(key) {
      if (!map.has(key)) return undefined;
      const value = map.get(key);
      map.delete(key);
      map.set(key, value);
      return value;
    },
    has(key) {
      return map.has(key);
    },
    size() {
      return map.size;
    }
  };
}
EOF

cat > sandboxes/js-katas/test/katas.test.js <<'EOF'
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  debounce,
  throttle,
  mapPolyfill,
  filterPolyfill,
  reducePolyfill,
  lruFactory
} from '../src/katas.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

test('debounce coalesces calls (trailing)', async () => {
  let calls = [];
  const d = debounce((x) => calls.push(x), 40);
  d(1);
  d(2);
  d(3);
  await sleep(70);
  assert.deepEqual(calls, [3]);
});

test('throttle limits call frequency (leading)', async () => {
  let count = 0;
  const t = throttle(() => { count++; }, 40);
  const id = setInterval(() => t(), 10);
  await sleep(120);
  clearInterval(id);
  // ~3 calls expected (t≈0,40,80). Allow a small range for timing variance.
  assert.ok(count >= 2 && count <= 4, `count=${count}`);
});

test('map/filter/reduce happy paths', () => {
  const arr = [1, 2, 3];
  assert.deepEqual(mapPolyfill(arr, x => x * 2), [2, 4, 6]);
  assert.deepEqual(filterPolyfill(arr, x => x % 2 === 1), [1, 3]);
  assert.equal(reducePolyfill(arr, (a, x) => a + x, 0), 6);
});

test('LRU basic behavior', () => {
  const lru = lruFactory(2);
  lru.set('a', 1);
  lru.set('b', 2);
  assert.equal(lru.size(), 2);
  assert.equal(lru.get('a'), 1); // a becomes most-recent
  lru.set('c', 3);               // evicts b
  assert.equal(lru.has('b'), false);
  assert.equal(lru.has('a'), true);
  assert.equal(lru.has('c'), true);
});
EOF

cat > sandboxes/js-katas/src/scratch.mjs <<'EOF'
// Scratchpad
// Example: node src/scratch.mjs
import { mapPolyfill } from './katas.js';
console.log(mapPolyfill([1,2,3], x => x * 10));
EOF

# 2) sandboxes/react-katas (Vite + React, JS)
mkdir -p sandboxes/react-katas/src/components sandboxes/react-katas/src/hooks
cat > sandboxes/react-katas/package.json <<'EOF'
{
  "name": "react-katas",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --strictPort --port 5173"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "4.3.2",
    "vite": "5.4.9"
  }
}
EOF

cat > sandboxes/react-katas/index.html <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>react-katas</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
  </html>
EOF

cat > sandboxes/react-katas/vite.config.js <<'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()]
});
EOF

cat > sandboxes/react-katas/src/main.jsx <<'EOF'
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > sandboxes/react-katas/src/hooks/useCancelableFetch.js <<'EOF'
import { useEffect, useState } from 'react';

export function useCancelableFetch(query) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query) {
      setData([]);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    // HN Algolia API (CORS-friendly)
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}`;

    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const items = (json.hits || []).map(h => h.title || '(untitled)');
        setData(items);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [query]);

  return { data, loading, error };
}
EOF

cat > sandboxes/react-katas/src/components/VirtualList.jsx <<'EOF'
import React from 'react';

export function VirtualList({ items, itemHeight = 32, height = 320, renderItem }) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(height / itemHeight) + 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endIndex = Math.min(items.length, startIndex + visibleCount);
  const topOffset = startIndex * itemHeight;

  const onScroll = (e) => setScrollTop(e.currentTarget.scrollTop);

  return (
    <div style={{ height, overflowY: 'auto', border: '1px solid #ddd' }} onScroll={onScroll}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${topOffset}px)` }}>
          {items.slice(startIndex, endIndex).map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight, display: 'flex', alignItems: 'center', padding: '0 8px', borderBottom: '1px solid #f3f3f3' }}>
              {renderItem ? renderItem(item, startIndex + i) : item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
EOF

cat > sandboxes/react-katas/src/App.jsx <<'EOF'
import React from 'react';
import { useCancelableFetch } from './hooks/useCancelableFetch.js';
import { VirtualList } from './components/VirtualList.jsx';

export default function App() {
  const [input, setInput] = React.useState('');
  const [query, setQuery] = React.useState('');
  const { data, loading, error } = useCancelableFetch(query);

  const filtered = React.useMemo(() => {
    const q = input.trim().toLowerCase();
    if (!q) return data;
    return data.filter(d => String(d).toLowerCase().includes(q));
  }, [data, input]);

  const onKeyDown = (e) => {
    if (e.key === 'Enter') setQuery(input);
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 16, maxWidth: 800, margin: '0 auto' }}>
      <label htmlFor="search" style={{ display: 'block', marginBottom: 8 }}>Search</label>
      <input
        id="search"
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        aria-label="Search query"
        placeholder="Type and press Enter"
        style={{ width: '100%', padding: '8px 10px', borderRadius: 12, border: '1px solid #ccc', marginBottom: 12 }}
      />
      <div aria-live="polite" style={{ minHeight: 24, marginBottom: 8 }}>
        {loading ? 'Loading…' : error ? `Error: ${error.message}` : query ? `Results for "${query}": ${data.length}` : 'Idle'}
      </div>
      <VirtualList
        items={filtered}
        itemHeight={32}
        height={320}
        renderItem={(item, idx) => <div>{idx + 1}. {item}</div>}
      />
      <p style={{ color: '#666', marginTop: 12 }}>A11y: labeled input, Enter to search, status updates via aria-live.</p>
    </div>
  );
}
EOF

# 3) lynx-chat (tiny web demo; Vite + React for local preview)
mkdir -p lynx-chat/src/components lynx-chat/src/hooks
cat > lynx-chat/package.json <<'EOF'
{
  "name": "lynx-chat",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview --strictPort --port 5174"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "4.3.2",
    "vite": "5.4.9"
  }
}
EOF

cat > lynx-chat/index.html <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>lynx-chat</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
  </html>
EOF

cat > lynx-chat/vite.config.js <<'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()]
});
EOF

cat > lynx-chat/src/main.jsx <<'EOF'
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<App />);
EOF

cat > lynx-chat/src/App.jsx <<'EOF'
import React from 'react';
import { ChatWindow } from './components/ChatWindow.jsx';

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>Lynx + ReactLynx patterns (web demo)</h1>
      <ChatWindow />
    </div>
  );
}
EOF

cat > lynx-chat/src/hooks/useStream.js <<'EOF'
import { useRef, useState } from 'react';

export function useStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef(null);

  const startStream = (text, onToken, onDone) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const tokens = String(text).split(/\s+/).map(t => t + ' ');
    let i = 0;
    setIsStreaming(true);
    intervalRef.current = setInterval(() => {
      if (i < tokens.length) {
        onToken(tokens[i++]);
      } else {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsStreaming(false);
        onDone && onDone();
      }
    }, 60);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsStreaming(false);
    }
  };

  return { isStreaming, startStream, stop };
}
EOF

cat > lynx-chat/src/components/ChatWindow.jsx <<'EOF'
import React from 'react';
import { useStream } from '../hooks/useStream.js';

export function ChatWindow() {
  const [messages, setMessages] = React.useState([
    { role: 'assistant', content: 'Hi! Ask me anything.' }
  ]);
  const [input, setInput] = React.useState('');
  const [showCitations, setShowCitations] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [memory, setMemory] = React.useState(false);
  const { isStreaming, startStream, stop } = useStream();

  const handleSendRequest = () => {
    if (!input.trim()) return;
    setShowConfirm(true);
  };

  const confirmSend = () => {
    setShowConfirm(false);
    const userMsg = { role: 'user', content: input };
    const assistantMsg = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    const reply = 'Streaming response with useful info and citations.';
    setInput('');
    startStream(reply, (token) => {
      setMessages(prev => {
        const copy = prev.slice();
        copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + token };
        return copy;
      });
    });
  };

  return (
    <div>
      <div aria-live="polite" style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12, minHeight: 200, marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: '6px 0' }}>
            <strong>{m.role === 'user' ? 'You' : 'Assistant'}:</strong> {m.content}
          </div>
        ))}
        {isStreaming && <div style={{ color: '#888' }}>… streaming</div>}
      </div>

      <textarea
        aria-label="Message"
        rows={3}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendRequest();
          }
        }}
        placeholder="Type message. Enter to send. Shift+Enter for newline."
        style={{ width: '100%', padding: '8px 10px', borderRadius: 12, border: '1px solid #ccc', marginBottom: 8 }}
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <button onClick={handleSendRequest} style={{ padding: '8px 12px', borderRadius: 12 }}>Send</button>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={memory} onChange={() => setMemory(v => !v)} />
          Memory
        </label>
        <button onClick={() => setShowCitations(s => !s)} style={{ padding: '6px 10px', borderRadius: 12 }}>
          {showCitations ? 'Hide' : 'Show'} citations
        </button>
        {isStreaming && <button onClick={stop} style={{ padding: '6px 10px', borderRadius: 12 }}>Stop</button>}
      </div>

      {showCitations && (
        <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 10, marginBottom: 12 }}>
          <strong>Citations</strong>
          <ul style={{ margin: '6px 0 0 18px' }}>
            <li><a href="https://example.com" target="_blank" rel="noreferrer">https://example.com</a></li>
            <li><a href="https://developer.mozilla.org/" target="_blank" rel="noreferrer">https://developer.mozilla.org/</a></li>
          </ul>
        </div>
      )}

      {showConfirm && (
        <div role="dialog" aria-modal="true" aria-label="Confirm send" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'#fff', padding:16, borderRadius:12, minWidth:280 }}>
            <p style={{ marginTop:0 }}>Send this message?</p>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={() => setShowConfirm(false)} style={{ padding:'6px 10px', borderRadius:12 }}>Cancel</button>
              <button onClick={confirmSend} style={{ padding:'6px 10px', borderRadius:12 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
EOF

cat > lynx-chat/README.md <<'EOF'
# lynx-chat

Tiny web demo showing AI-UX chat patterns:
- Streaming simulation (tokens appended over time)
- Citations drawer (toggle)
- Agent confirmation before sending
- Memory toggle (UX affordance only)

Why Lynx: This mirrors common AI-UX patterns you’d use with Lynx + ReactLynx on web. This scaffold uses Vite + React for a fast local preview. Swap in Lynx/ReactLynx web renderer when available in your environment.

Run
- npm i
- npm run dev

Trade-offs
- No real model or backend; streaming is simulated
- Minimal styling; focuses on UX behaviors
- Replace with real Lynx renderer/SDK if required
EOF

echo
echo "Done. Created/updated monorepo at: $(pwd)"
echo
echo "File tree:"
# Portable tree using find (excluding node_modules)
find . -path '*/node_modules' -prune -o -print | sed 's|^\./||' | awk '{gsub(/[^\/]/, " ", $0); gsub(/\//, "|", $0); print $0}' >/dev/null 2>&1 || true
# Simpler fallback: limited depth tree
find . -maxdepth 3 -path '*/node_modules' -prune -o -print | sed 's|^\./||'

echo
echo "Quick README (commands):"
cat <<'EOF'
JS katas
- cd tiktok-prep/sandboxes/js-katas
- npm i
- npm test
- npm run watch   # optional fast feedback
- node src/scratch.mjs

React katas
- cd tiktok-prep/sandboxes/react-katas
- npm i
- npm run dev

Lynx chat (web demo)
- cd tiktok-prep/lynx-chat
- npm i
- npm run dev
EOF

