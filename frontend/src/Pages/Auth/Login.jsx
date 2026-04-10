import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user, error, setError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-[calc(100vh-72px)] flex items-center justify-center p-6 bg-surface-container-low">
      <div className="w-full max-w-md bg-surface-container-lowest p-10 rounded-xl shadow-[0px_20px_40px_rgba(11,28,48,0.06)] relative overflow-hidden">
        {/* Decorative corner element */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-fixed/30 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold font-headline text-on-surface mb-2">Welcome Back</h1>
            <p className="text-secondary font-body">Sign in to access your clinical intelligence dashboard.</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg text-sm font-bold font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface-container-low border-b-2 border-outline-variant/30 focus:bg-surface-container-lowest focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                placeholder="doctor@vitality.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold font-label text-on-surface-variant uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-surface-container-low border-b-2 border-outline-variant/30 focus:bg-surface-container-lowest focus:border-primary focus:outline-none transition-all rounded-t-md font-body text-on-surface"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 text-primary bg-surface-container border-outline rounded flex-shrink-0 cursor-pointer" />
                <span className="text-sm text-secondary group-hover:text-on-surface transition-colors font-body">Remember me</span>
              </label>
              <a href="#" className="text-sm text-primary font-bold hover:text-primary-container transition-colors font-body">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full mt-8 bg-gradient-to-br from-primary to-primary-container text-white py-4 rounded-full font-bold text-lg hover:shadow-[0_10px_20px_rgba(0,110,47,0.2)] hover:-translate-y-0.5 active:translate-y-0 transition-all font-body"
            >
              Sign In
            </button>
          </form>

          <p className="mt-8 text-center text-secondary font-body">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:text-primary-container transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;