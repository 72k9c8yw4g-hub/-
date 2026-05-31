import { useEffect, useState } from 'react';
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

  if (page === 'admin')      return <AdminPage />;
  if (page === 'purchasing') return <PurchasingPage />;
  return <MainPage />;
}
