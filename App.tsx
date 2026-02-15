import React, { useEffect, useState } from 'react';
import Feed from './pages/Feed';
import Favorites from './pages/Favorites';

type Page = 'feed' | 'favorites';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('feed');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      tg.headerColor = '#ffffff';
      tg.backgroundColor = '#ffffff';
    }
  }, []);

  return (
    <div className="h-[100dvh] w-full bg-white overflow-hidden font-sans antialiased">
      {currentPage === 'feed' && (
        <Feed 
          favorites={favorites}
          setFavorites={setFavorites}
          favoritesLoaded={favoritesLoaded}
          setFavoritesLoaded={setFavoritesLoaded}
          onOpenFavorites={() => setCurrentPage('favorites')}
        />
      )}
      {currentPage === 'favorites' && (
        <Favorites 
          favorites={favorites}
          setFavorites={setFavorites}
          onBack={() => setCurrentPage('feed')}
        />
      )}
    </div>
  );
};

export default App;