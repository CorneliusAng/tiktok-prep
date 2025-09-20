import React from 'react';
import { readTextStream } from '../lib/stream.js';

export function useGeminiStream({ endpoint = '/api/chat' } = {}) {
  const [messages, setMessages] = React.useState([
    { role: 'assistant', content: 'Hi! Ask me anything.' }
  ]);
  const [status, setStatus] = React.useState('idle'); // idle|streaming|error
  const [error, setError] = React.useState(null);
  const abortRef = React.useRef(null);

  const send = React.useCallback(async (text) => {
    if (!text || !text.trim()) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('streaming');
    setError(null);

    setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, { role: 'user', content: text }] }),
        signal: controller.signal
      });

      if (!res.ok) {
        // Mark error but still attempt to read a fallback stream (e.g., 503 demo stream)
        setError(new Error(`HTTP ${res.status}`));
      }

      const body = res.body;
      for await (const chunk of readTextStream(body)) {
        setMessages(prev => {
          const copy = prev.slice();
          const lastIdx = copy.length - 1;
          copy[lastIdx] = { ...copy[lastIdx], content: copy[lastIdx].content + chunk };
          return copy;
        });
      }
      setStatus('idle');
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      setStatus('error');
      setError(err);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [endpoint, messages]);

  const cancel = React.useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, send, status, error, cancel };
}


