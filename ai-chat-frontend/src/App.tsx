import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import { useChatStore } from './store';

function App() {
  const token = useChatStore((s) => s.token);
  const theme = useChatStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = () => root.classList.toggle('dark', mq.matches);
      apply();
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  return (
    <><Toaster position="top-center" richColors /><BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/" /> : <Register />} />
        <Route path="/" element={token ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/settings" element={token ? <Settings /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter></>
  );
}

export default App;
