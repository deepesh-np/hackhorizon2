import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Active link styling
  const linkClass = (path) =>
    `relative font-bold tracking-tight transition-all duration-300 ${location.pathname === path
      ? "text-green-600 dark:text-green-400"
      : "text-slate-800 dark:text-slate-200 hover:text-green-600"
    }`;

  // Animation variants
  const navAnimation = {
    hidden: { y: -80, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.6 } }
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
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
        ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-md border-b border-slate-200 dark:border-slate-800"
        : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 dark:border-slate-800/50"
        }`}
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto px-6 py-4">

        {/* LOGO */}
        <Link
          to="/"
          className="text-2xl font-black text-slate-900 dark:text-white tracking-tight"
        >
          Vitality<span className="text-green-600">.</span>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex gap-8 items-center">

          {user ? (
            <>
              {[
                { path: "/home", label: "Dashboard" },
                { path: "/prescriptions", label: "Prescriptions" }
              ].map((item, i) => (
                <Link key={i} to={item.path} className={linkClass(item.path)}>
                  {item.label}

                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="underline"
                      className="absolute left-0 -bottom-1 h-[2px] w-full bg-green-600 rounded-full"
                    />
                  )}
                </Link>
              ))}

              {user.role === "admin" && (
                <Link to="/admin" className={linkClass("/admin")}>
                  Admin
                </Link>
              )}

              {user.role === "vendor" && (
                <Link to="/vendor" className={linkClass("/vendor")}>
                  Vendor
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/" className={linkClass("/")}>
                Platform
              </Link>
              <a href="#" className="font-bold text-slate-800 dark:text-slate-200 hover:text-green-600 transition-colors">
                Solutions
              </a>
              <a href="#" className="font-bold text-slate-800 dark:text-slate-200 hover:text-green-600 transition-colors">
                Intelligence
              </a>
            </>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">

          {user ? (
            <>
              {/* User Profile Avatar */}
              <Link to="/profile" className="hidden sm:block">
                <img
                  src={user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0f172a&color=fff&rounded=true&bold=true`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:scale-105 transition-transform"
                />
              </Link>

              {/* Logout Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={logout}
                className="p-2 rounded-full text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </motion.button>
            </>
          ) : (
            <>
              {/* Login */}
              <Link
                to="/login"
                className="hidden sm:block font-bold text-slate-800 dark:text-slate-200 hover:text-green-600 transition-colors"
              >
                Log In
              </Link>

              {/* Register */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
                <Link
                  to="/register"
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-full font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Get Started
                </Link>
              </motion.div>
            </>
          )}

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-2xl text-slate-700 dark:text-white"
          >
            {menuOpen ? "✕" : "☰"}
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
            className="md:hidden bg-white dark:bg-slate-900 px-6 pb-6 space-y-4 shadow-lg"
          >
            {user ? (
              <>
                <Link to="/home" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link to="/prescriptions" onClick={() => setMenuOpen(false)}>Prescriptions</Link>
                {user.role === "admin" && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>
                )}

                {user.role === "vendor" && (
                  <Link to="/vendor" onClick={() => setMenuOpen(false)}>Vendor</Link>
                )}

                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="w-full bg-green-500 text-white py-2 rounded-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/" onClick={() => setMenuOpen(false)}>Platform</Link>
                <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;