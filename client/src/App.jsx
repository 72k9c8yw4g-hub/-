import { useEffect, useState } from 'react';
import { StoreProvider } from './lib/store.jsx';
import MainPage      from './pages/MainPage.jsx';
import AdminPage     from './pages/AdminPage.jsx';
import PurchasingPage from './pages/PurchasingPage.jsx';

function getPage() {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  if (hash.startsWith('admin'))      return 'admin';
  if (hash.startsWith('purchasing')) return 'purchasing';
  return 'main';
}

export default function App() {
  const [page, setPage] = useState(getPage);

  useEffect(() => {
    const handler = () => setPage(getPage());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return (
    <StoreProvider>
      {page === 'main'       && <MainPage />}
      {page === 'admin'      && <AdminPage />}
      {page === 'purchasing' && <PurchasingPage />}
    </StoreProvider>
  );
}
