import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/authStore';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { AppPage } from './pages/AppPage';

function App() {
  const { user, setUser, setLoading, loading } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, [setUser, setLoading]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Chatteme...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/app" element={user ? <AppPage /> : <Navigate to="/auth" />} />
        <Route path="/" element={user ? <Navigate to="/app" /> : <Navigate to="/auth" />} />
      </Routes>
    </Router>
  );
}

export default App;
