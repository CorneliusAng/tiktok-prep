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
