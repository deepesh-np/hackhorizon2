import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const stagger = {
    show: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

function Landing() {
    return (
        <div className="relative overflow-hidden">
            {/* HERO SECTION */}
            <section className="relative pt-40 pb-32">
                {/* Background Blobs */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] left-[-20%] w-[600px] h-[600px] bg-teal-500/5 blur-[120px] rounded-full"></div>
                </div>

                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className="max-w-7xl mx-auto px-6 text-center"
                >
                    <motion.div
                        variants={fadeUp}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
                    >
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Global Health Intelligence</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
                        className="mb-8"
                    >
                         <p className="text-sm md:text-md font-black text-primary/80 italic tracking-tight font-serif">
                            "Same active salt, different brand name; The healing power stays exactly the same."
                        </p>
                    </motion.div>

                    <motion.h1
                        variants={fadeUp}
                        className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter text-on-background"
                    >
                        Find Affordable <br />
                        <span className="text-gradient">Medicines Now.</span>
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        className="text-xl md:text-2xl text-on-surface-variant max-w-3xl mx-auto mb-12 font-medium leading-relaxed"
                    >
                        The intelligent clinical engine for comparing pharmaceutical data, 
                        finding generic alternatives, and saving up to 80% on prescriptions.
                    </motion.p>

                    <motion.div
                        variants={fadeUp}
                        className="flex flex-col sm:flex-row justify-center gap-6"
                    >
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                to="/home"
                                className="bg-primary text-white px-10 py-5 rounded-2xl font-bold shadow-2xl shadow-primary/20 flex items-center gap-3 group"
                            >
                                Start Searching
                                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                            </Link>
                        </motion.div>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <button
                                className="bg-white border border-outline px-10 py-5 rounded-2xl font-bold hover:bg-surface-container transition-all"
                            >
                                How It Works
                            </button>
                        </motion.div>
                    </motion.div>
                </motion.div>
            </section>

            {/* FEATURES */}
            <section className="py-32 bg-surface-container-low border-y border-outline/50 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="mb-20 space-y-4">
                        <h2 className="text-sm font-black text-primary uppercase tracking-[0.3em]">The Engine</h2>
                        <h3 className="text-4xl md:text-5xl font-black text-on-background tracking-tighter">Revolutionizing Healthcare Access.</h3>
                    </div>

                    <motion.div
                        variants={stagger}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {[
                            {
                                icon: "search_spark",
                                title: "AI Search",
                                desc: "Proprietary algorithms to map generic equivalents instantly."
                            },
                            {
                                icon: "savings",
                                title: "Cost Efficiency",
                                desc: "Transparent pricing models saving users millions globally."
                            },
                            {
                                icon: "verified_user",
                                title: "Clinical Grade",
                                desc: "Data sourced from verified medical authorities and FDA logs."
                            },
                            {
                                icon: "near_me",
                                title: "Geospatial Data",
                                desc: "Real-time inventory tracking at local pharmacy networks."
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                className="card-premium p-8"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                    <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                                </div>
                                <h3 className="text-xl font-black mb-3 text-on-surface">
                                    {item.title}
                                </h3>
                                <p className="text-on-surface-variant text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* STATS SECTION */}
            <section className="py-32 relative overflow-hidden bg-on-background text-white">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,#059669,#0f172a)]"></div>
                </div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                        {[
                            { value: "4.8M", label: "Monthly Users" },
                            { value: "12K+", label: "Pharmacies" },
                            { value: "82%", label: "Average Savings" },
                            { value: "24/7", label: "Intelligence" }
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="text-5xl md:text-6xl font-black mb-2 tracking-tighter">
                                    {item.value}
                                </div>
                                <div className="text-sm font-bold text-primary uppercase tracking-[0.2em]">
                                    {item.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-40 text-center relative">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                    >
                        <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tighter">
                            Take control of <br />
                            <span className="text-gradient">your health spending.</span>
                        </h2>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                            <Link
                                to="/register"
                                className="bg-primary text-white px-12 py-6 rounded-3xl font-bold shadow-2xl shadow-primary/30 text-xl"
                            >
                                Create Free Account
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}

export default Landing;