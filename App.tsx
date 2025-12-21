
import React, { useEffect } from 'react';
import Feed from './pages/Feed';

const App: React.FC = () => {
  console.log('📱 App rendering');  // ← добавь
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      // Set light theme colors
      tg.headerColor = '#ffffff';
      tg.backgroundColor = '#ffffff';
    }
  }, []);

  return (
    <div className="h-[100dvh] w-full bg-white overflow-hidden font-sans antialiased">
      <Feed />
    </div>
  );
};

export default App;
