import React from 'react';
import { useGeminiStream } from '../hooks/useGeminiStream.js';

export function ChatWindow() {
  const { messages, send, status, error, cancel } = useGeminiStream();
  const [input, setInput] = React.useState('');
  const [showCitations, setShowCitations] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [memory, setMemory] = React.useState(false);

  const handleSendRequest = () => {
    if (!input.trim()) return;
    setShowConfirm(true);
  };

  const confirmSend = () => {
    setShowConfirm(false);
    setInput('');
    send(input);
  };

  return (
    <div>
      <div aria-live="polite" style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12, minHeight: 200, marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ margin: '6px 0' }}>
            <strong>{m.role === 'user' ? 'You' : 'Assistant'}:</strong> {m.content}
          </div>
        ))}
        {status === 'streaming' && <div style={{ color: '#888' }}>… streaming</div>}
        {status === 'error' && <div style={{ color: '#b00' }}>Error. Check server and try again.</div>}
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
        {status === 'streaming' && <button onClick={cancel} style={{ padding: '6px 10px', borderRadius: 12 }}>Cancel</button>}
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
