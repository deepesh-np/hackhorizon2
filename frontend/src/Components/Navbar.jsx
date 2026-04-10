import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl shadow-[0px_20px_40px_rgba(11,28,48,0.06)]">
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 py-4">
        <Link to="/" className="text-2xl font-black text-slate-900 dark:text-white font-headline tracking-tight hover:opacity-80 transition-opacity">
          Vitality Intelligence
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          {user ? (
            <>
              <Link to="/home" className="text-slate-600 dark:text-slate-400 hover:text-green-600 transition-colors font-headline tracking-tight font-bold">Dashboard</Link>
              <Link to="/prescriptions" className="text-slate-600 dark:text-slate-400 hover:text-green-600 transition-colors font-headline tracking-tight font-bold">Prescriptions</Link>
              <Link to="/profile" className="text-slate-600 dark:text-slate-400 hover:text-green-600 transition-colors font-headline tracking-tight font-bold">Profile</Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="text-slate-600 dark:text-slate-400 hover:text-green-600 transition-colors font-headline tracking-tight font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                  Admin
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/" className="text-green-600 dark:text-green-400 font-bold border-b-2 border-green-600 font-headline tracking-tight">Platform</Link>
              <a className="text-slate-600 dark:text-slate-400 hover:text-green-600 transition-colors font-headline tracking-tight" href="#">Solutions</a>
              <a className="text-slate-600 dark:text-slate-400 hover:text-green-600 transition-colors font-headline tracking-tight" href="#">Intelligence</a>
            </>
          )}
        </div>
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-slate-500 font-body">
                {user.name.split(' ')[0]}
              </span>
              <button onClick={logout} className="bg-gradient-to-br from-primary to-primary-container text-white font-bold px-6 py-2.5 rounded-full hover:opacity-80 scale-95 active:scale-90 transition-all duration-300 font-body text-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block text-slate-600 hover:text-green-600 font-bold transition-all px-4 py-2 font-headline">Log In</Link>
              <Link to="/register" className="bg-gradient-to-br from-primary to-primary-container text-white font-bold px-6 py-2.5 rounded-full hover:opacity-80 scale-95 active:scale-90 transition-all duration-300 font-body">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
