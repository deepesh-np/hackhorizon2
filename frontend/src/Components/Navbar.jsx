import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  // High-contrast, user-friendly colors that match Home.jsx
  const textColor = "text-on-surface-variant";
  const activeColor = "text-primary";
  const hoverColor = "hover:text-primary";

  const linkClass = (path) =>
    `relative flex items-center px-4 py-2 rounded-xl font-bold tracking-tight text-sm transition-all duration-300 ${location.pathname === path
      ? `${activeColor} bg-primary/10 shadow-sm border border-primary/10`
      : `${textColor} ${hoverColor} hover:bg-surface-container`
    }`;

  // Animation variants
  const navAnimation = {
    hidden: { y: -80, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const mobileMenuAnimation = {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <motion.nav
      variants={navAnimation}
      initial="hidden"
      animate="show"
      className="fixed top-0 w-full z-100 bg-white/95 backdrop-blur-xl border-t-2 border-primary border-b border-outline/30 shadow-[0_4px_30px_rgba(0,0,0,0.05)] px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* LOGO */}
        <Link
          to="/"
          className="text-2xl font-black tracking-tighter flex items-center gap-1 group"
        >
          <span className="text-gradient">Vitality</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
        </Link>

        {/* DESKTOP MENU - Intelligence Centric */}
        <div className="hidden md:flex gap-2 items-center bg-surface-container/50 p-1.5 rounded-2xl border border-outline/30">
          {user ? (
            <>
              {[
                { path: "/home", label: "Intelligence Hub", icon: "dashboard_customize" },
                { path: "/prescriptions", label: "Clinical Logs", icon: "assignment_late" }
              ].map((item, i) => (
                <Link key={i} to={item.path} className={linkClass(item.path)}>
                  <span className="material-symbols-outlined text-[18px] mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {user.role === "admin" && (
                <Link to="/admin" className={linkClass("/admin")}>
                  <span className="material-symbols-outlined text-[18px] mr-2">admin_panel_settings</span>
                  Network Admin
                </Link>
              )}

              {user.role === "vendor" && (
                <Link to="/vendor" className={linkClass("/vendor")}>
                  <span className="material-symbols-outlined text-[18px] mr-2">store</span>
                  Pharmacy Portal
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/" className={linkClass("/")}>
                <span className="material-symbols-outlined text-[18px] mr-2">home</span>
                Platform
              </Link>
              <Link to="/login" className={linkClass("/login")}>
                <span className="material-symbols-outlined text-[18px] mr-2">login</span>
                Authentication
              </Link>
            </>
          )}
        </div>

        {/* RIGHT SIDE - Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2 pl-4 border-l border-outline/50">
              {/* Profile Shortcut */}
              <Link
                to="/profile"
                className="flex items-center gap-3 p-1 pr-4 rounded-xl hover:bg-surface-container-high transition-all"
              >
                <img
                  src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=10b981&color=fff&rounded=true&bold=true`}
                  alt="Profile"
                  className="w-8 h-8 rounded-lg border border-outline shadow-sm"
                />
                <div className="hidden lg:block text-left leading-tight">
                  <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest">Active Member</p>
                  <p className="text-[13px] font-bold text-on-background line-clamp-1">{user.name}</p>
                </div>
              </Link>

              {/* Logout button */}
              <button
                onClick={logout}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-all"
                title="Secure Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/register"
                className="bg-on-background text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-xl hover:shadow-on-background/20 transition-all text-sm"
              >
                Create Account
              </Link>
            </div>
          )}

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container text-on-background hover:bg-outline transition-colors"
          >
            <span className="material-symbols-outlined">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            variants={mobileMenuAnimation}
            initial="hidden"
            animate="show"
            exit="exit"
            className="md:hidden absolute top-full left-0 w-full bg-white border-b border-outline shadow-2xl p-6 flex flex-col gap-2"
          >
            {user ? (
              <>
                <Link to="/home" className="flex items-center p-4 rounded-xl font-bold text-on-background hover:bg-surface-container" onClick={() => setMenuOpen(false)}>
                  <span className="material-symbols-outlined mr-3">dashboard_customize</span> Intelligence Hub
                </Link>
                <Link to="/prescriptions" className="flex items-center p-4 rounded-xl font-bold text-on-background hover:bg-surface-container" onClick={() => setMenuOpen(false)}>
                  <span className="material-symbols-outlined mr-3">assignment_late</span> Clinical Logs
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="w-full bg-error text-white p-4 rounded-xl font-bold mt-4"
                >
                  Secure Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/" className="p-4 rounded-xl font-bold text-on-background" onClick={() => setMenuOpen(false)}>Platform</Link>
                <Link to="/register" className="bg-primary text-white p-4 rounded-xl font-bold text-center" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;