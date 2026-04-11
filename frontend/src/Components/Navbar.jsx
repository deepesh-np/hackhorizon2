import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import { useLanguage } from "../Context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

function Navbar() {
  const { user, logout } = useAuth();
  const { t, lang, toggleLanguage } = useLanguage();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);

  const textColor = "text-on-surface-variant";
  const activeColor = "text-primary";
  const hoverColor = "hover:text-primary";

  const linkClass = (path) =>
    `relative flex items-center px-4 py-2 rounded-xl font-bold tracking-tight text-sm transition-all duration-300 ${location.pathname === path
      ? `${activeColor} bg-primary/10 shadow-sm border border-primary/10`
      : `${textColor} ${hoverColor} hover:bg-surface-container`
    }`;

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
                { path: "/home", label: t("nav_home"), icon: "dashboard_customize" },
                { path: "/prescriptions", label: t("nav_clinics"), icon: "assignment_late" },
                { path: "/cart", label: t("nav_cart"), icon: "shopping_cart" }
              ].map((item, i) => (
                <Link key={i} to={item.path} className={linkClass(item.path)}>
                  <span className="material-symbols-outlined text-[18px] mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              {user.role === "admin" && (
                <Link to="/admin" className={linkClass("/admin")}>
                  <span className="material-symbols-outlined text-[18px] mr-2">admin_panel_settings</span>
                  {t("nav_admin")}
                </Link>
              )}

              {user.role === "vendor" && (
                <Link to="/vendor" className={linkClass("/vendor")}>
                  <span className="material-symbols-outlined text-[18px] mr-2">store</span>
                  {t("nav_vendor")}
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/" className={linkClass("/")}>
                <span className="material-symbols-outlined text-[18px] mr-2">home</span>
                {t("nav_platform")}
              </Link>
              <Link to="/login" className={linkClass("/login")}>
                <span className="material-symbols-outlined text-[18px] mr-2">login</span>
                {t("nav_auth")}
              </Link>
            </>
          )}
        </div>

        {/* RIGHT SIDE - Actions */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLanguage} 
            className="flex items-center gap-1 bg-surface-container hover:bg-primary hover:text-white transition-colors px-3 py-1.5 rounded-full text-xs font-bold border border-outline/20"
          >
            <span className="material-symbols-outlined text-[16px]">translate</span>
            {t("switch_lang")}
          </button>
          {user ? (
            <div className="flex items-center gap-2 pl-4 border-l border-outline/50">
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
                  <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest">{t("active_member")}</p>
                  <p className="text-[13px] font-bold text-on-background line-clamp-1">{user.name}</p>
                </div>
              </Link>

              <button
                onClick={logout}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-error/10 hover:text-error transition-all"
                title={t("secure_sign_out")}
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
                {t("create_account")}
              </Link>
            </div>
          )}

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
                  <span className="material-symbols-outlined mr-3">dashboard_customize</span> {t("nav_home")}
                </Link>
                <Link to="/prescriptions" className="flex items-center p-4 rounded-xl font-bold text-on-background hover:bg-surface-container" onClick={() => setMenuOpen(false)}>
                  <span className="material-symbols-outlined mr-3">assignment_late</span> {t("nav_clinics")}
                </Link>
                <Link to="/cart" className="flex items-center p-4 rounded-xl font-bold text-on-background hover:bg-surface-container" onClick={() => setMenuOpen(false)}>
                  <span className="material-symbols-outlined mr-3">shopping_cart</span> {t("nav_cart")}
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="w-full bg-error text-white p-4 rounded-xl font-bold mt-4"
                >
                  {t("secure_logout")}
                </button>
              </>
            ) : (
              <>
                <Link to="/" className="p-4 rounded-xl font-bold text-on-background" onClick={() => setMenuOpen(false)}>{t("nav_platform")}</Link>
                <Link to="/register" className="bg-primary text-white p-4 rounded-xl font-bold text-center" onClick={() => setMenuOpen(false)}>{t("get_started")}</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Navbar;