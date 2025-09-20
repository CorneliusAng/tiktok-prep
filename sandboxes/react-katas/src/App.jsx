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
