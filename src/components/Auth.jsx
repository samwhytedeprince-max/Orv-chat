import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/authStore';
import { signUp, signIn } from '../lib/supabase';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { createProfile } = useAuthStore();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user;
      if (isLogin) {
        const { data, error: err } = await signIn(email, password);
        if (err) throw err;
        user = data.user;
      } else {
        const { data, error: err } = await signUp(email, password);
        if (err) throw err;
        user = data.user;
        await createProfile(user.id, {
          username: email.split('@')[0],
          display_name: email.split('@')[0],
        });
      }
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              Chatteme
            </h1>
            <p className="text-gray-600 text-sm">Free messaging without SMS or airtime</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? 'Loading...' : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm mb-3">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition"
            >
              {isLogin ? 'Create one' : 'Sign in instead'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
