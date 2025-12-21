
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('🔥 index.tsx loading');  // ← добавь

const container = document.getElementById('root');

console.log('📦 container:', container);  // ← добавь

if (!container) throw new Error('Root element not found');

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('✅ React mounted');  // ← добавь
