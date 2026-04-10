import React from 'react';

function Landing() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary-fixed/20 blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-surface-container-high/40 blur-[120px]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-on-surface font-headline">
            Find Affordable Medicines.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">Save More. Stay Safe.</span>
          </h1>
          <p className="text-xl md:text-2xl text-secondary mb-10 max-w-3xl mx-auto leading-relaxed">
            Compare medicine prices, discover generic alternatives, and locate nearby pharmacies with verified availability through our intelligence-driven platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-primary-container text-white px-8 py-4 rounded-full text-lg font-bold shadow-xl hover:shadow-primary-container/20 transition-all">
              <span className="material-symbols-outlined" data-icon="search">search</span>
              Search Medicine
            </button>
            <button className="flex items-center justify-center gap-2 border-2 border-outline text-on-surface px-8 py-4 rounded-full text-lg font-bold hover:bg-surface-container-low transition-all">
              <span className="material-symbols-outlined" data-icon="upload_file">upload_file</span>
              Upload Prescription
            </button>
          </div>
        </div>
      </section>

      {/* Features Section: Bento Grid / Glassmorphism */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-xl shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-white/40 group" style={{ backdropFilter: 'blur(24px)', backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
              <div className="w-14 h-14 bg-primary-fixed-dim/20 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-3xl" data-icon="search">search</span>
              </div>
              <h3 className="text-xl font-bold mb-3 font-headline">Smart Search</h3>
              <p className="text-secondary leading-relaxed">Instantly find any drug and its therapeutic equivalents with one tap.</p>
            </div>
            {/* Card 2 */}
            <div className="p-8 rounded-xl shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-white/40 group" style={{ backdropFilter: 'blur(24px)', backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
              <div className="w-14 h-14 bg-primary-fixed-dim/20 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-3xl" data-icon="pill">pill</span>
              </div>
              <h3 className="text-xl font-bold mb-3 font-headline">Generic Options</h3>
              <p className="text-secondary leading-relaxed">Save up to 80% by switching to clinically verified generic substitutes.</p>
            </div>
            {/* Card 3 */}
            <div className="p-8 rounded-xl shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-white/40 group" style={{ backdropFilter: 'blur(24px)', backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
              <div className="w-14 h-14 bg-primary-fixed-dim/20 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-3xl" data-icon="payments">payments</span>
              </div>
              <h3 className="text-xl font-bold mb-3 font-headline">Price Comparison</h3>
              <p className="text-secondary leading-relaxed">Compare live pricing across major retailers and local pharmacies.</p>
            </div>
            {/* Card 4 */}
            <div className="p-8 rounded-xl shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border border-white/40 group" style={{ backdropFilter: 'blur(24px)', backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
              <div className="w-14 h-14 bg-primary-fixed-dim/20 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-3xl" data-icon="distance">distance</span>
              </div>
              <h3 className="text-xl font-bold mb-3 font-headline">Verified Nearby</h3>
              <p className="text-secondary leading-relaxed">Find local stores that actually have your medicine in stock today.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section: Staggered Steps */}
      <section className="py-24 bg-surface-container-lowest overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4 font-headline">Intelligence at Every Step</h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img alt="Healthcare professional using tablet" className="rounded-xl shadow-2xl object-cover aspect-video" data-alt="Modern medical professional analyzing data on a tablet in a bright clinical office setting with soft shadows" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZ_bgyw8ErABNlB9wdRQE_apXUjOC-t6XU4FMpG1UwvZJQIssSK7mfT9Vb3GzDLc5HUEfCpIr9OWJCXXVOzlvcuqLxbADUauCH35tH4yee1IEUgXlS1pstKC0Wf6yazTig815U4KUBrD2jgxRk04kkuQWMooWh6vuwxmaaOUy78VElflE60V9Wz2FVLX5YXlGLmcONrtKbYnH3sXzNboLLR7KJy6MNmylRr9sx-f947R0rgwgPpx7Fo3G2eKcC4UgGnPqS_qSwKVk" />
              <div className="absolute -bottom-6 -right-6 p-6 rounded-xl shadow-lg border border-primary/10 max-w-[200px]" style={{ backdropFilter: 'blur(24px)', backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
                <p className="text-primary font-bold text-lg">99.9% Accuracy</p>
                <p className="text-sm text-secondary">Verified pharmaceutical data</p>
              </div>
            </div>
            <div className="space-y-12">
              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">1</div>
                <div>
                  <h4 className="text-2xl font-bold mb-2 font-headline">Scan Your Prescription</h4>
                  <p className="text-secondary">Upload a photo or enter medicine names manually. Our AI identifies active ingredients instantly.</p>
                </div>
              </div>
              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold text-xl group-hover:bg-primary group-hover:text-white transition-all">2</div>
                <div>
                  <h4 className="text-2xl font-bold mb-2 font-headline">Clinical Analysis</h4>
                  <p className="text-secondary">We cross-reference your medicines against a database of 50,000+ alternatives for maximum savings.</p>
                </div>
              </div>
              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold text-xl group-hover:bg-primary group-hover:text-white transition-all">3</div>
                <div>
                  <h4 className="text-2xl font-bold mb-2 font-headline">Compare Savings</h4>
                  <p className="text-secondary">See a transparent breakdown of costs from various manufacturers and delivery providers.</p>
                </div>
              </div>
              <div className="flex gap-6 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold text-xl group-hover:bg-primary group-hover:text-white transition-all">4</div>
                <div>
                  <h4 className="text-2xl font-bold mb-2 font-headline">Pick Up or Deliver</h4>
                  <p className="text-secondary">Choose a nearby pharmacy for immediate pickup or get your medicines delivered to your door.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section: Red High-Contrast */}
      <section className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-on-surface text-white rounded-xl p-12 md:p-20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-tertiary-container/10 blur-[100px] rounded-full"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="max-w-xl">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 font-headline">Stop Overpaying for Essential Care.</h2>
                <p className="text-xl text-slate-400 mb-8">Patients using Vitality Intelligence save an average of ₹4,200 per prescription by switching to bio-equivalent alternatives.</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl md:text-8xl font-black text-tertiary font-headline">70%</span>
                  <span className="text-2xl font-bold text-tertiary-container">SAVINGS</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
                  <p className="text-4xl font-bold text-primary-container font-headline">1M+</p>
                  <p className="text-sm text-slate-400">Users Monthly</p>
                </div>
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
                  <p className="text-4xl font-bold text-primary-container font-headline">5k+</p>
                  <p className="text-sm text-slate-400">Partner Stores</p>
                </div>
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
                  <p className="text-4xl font-bold text-primary-container font-headline">24/7</p>
                  <p className="text-sm text-slate-400">Care Support</p>
                </div>
                <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
                  <p className="text-4xl font-bold text-primary-container font-headline">Zero</p>
                  <p className="text-sm text-slate-400">Service Fees</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 font-headline">Ready to prioritize your health and your wallet?</h2>
          <p className="text-xl text-secondary mb-10">Join thousands of others making smarter healthcare choices with clinical intelligence.</p>
          <div className="relative inline-block">
            <button className="bg-primary text-white px-12 py-5 rounded-full text-xl font-bold hover:shadow-[0_0_30px_rgba(0,110,47,0.3)] transition-all animate-pulse duration-[2000ms]">
              Get Started Now
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

export default Landing;