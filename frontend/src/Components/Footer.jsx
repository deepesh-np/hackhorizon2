import React from 'react';

function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-headline">Vitality Intelligence</div>
          <p className="text-slate-500 text-sm font-label tracking-wide">© 2024 Vitality Framework. Clinical Intelligence for All.</p>
        </div>
        <div className="flex flex-wrap justify-end gap-6 text-label">
          <a className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all text-sm tracking-wide" href="#">Privacy Policy</a>
          <a className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all text-sm tracking-wide" href="#">Terms of Service</a>
          <a className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all text-sm tracking-wide" href="#">Compliance</a>
          <a className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all text-sm tracking-wide" href="#">Contact Support</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
