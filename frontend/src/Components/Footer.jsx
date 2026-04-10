import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="w-full bg-surface-container border-t border-outline/50 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="text-2xl font-black text-on-background tracking-tighter flex items-center gap-1 mb-4">
              <span className="text-gradient">Vitality</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></span>
            </Link>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
              Advanced medical intelligence platform providing affordable healthcare solutions through clinical insights and real-time pharmacy data.
            </p>
            <div className="flex gap-4">
              {/* Social Placeholders */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-surface border border-outline flex items-center justify-center hover:border-primary/50 cursor-pointer transition-colors">
                  <div className="w-3 h-3 bg-on-surface-variant rounded-sm"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="font-bold text-on-surface mb-6 text-sm uppercase tracking-widest">Platform</h4>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li><a href="#" className="hover:text-primary transition-colors">Medicines</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pharmacy Locator</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Intelligence</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Enterprise</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="font-bold text-on-surface mb-6 text-sm uppercase tracking-widest">Company</h4>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Compliance</a></li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div>
            <h4 className="font-bold text-on-surface mb-6 text-sm uppercase tracking-widest">Stay Connected</h4>
            <p className="text-sm text-on-surface-variant mb-4">Get the latest healthcare updates.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email address" 
                className="bg-surface border border-outline rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
              />
              <button className="bg-primary text-white p-2 rounded-lg hover:shadow-lg transition-all">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-outline/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-on-surface-variant text-xs font-medium tracking-wide">
            © 2024 Vitality Intelligence Framework. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              System Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
