import React from "react";
import { motion } from "framer-motion";

const fadeUp = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
    show: {
        transition: {
            staggerChildren: 0.2
        }
    }
};

function Landing() {
    return (
        <>
            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-green-200/40 blur-[120px] rounded-full"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-green-100/40 blur-[120px] rounded-full"></div>
                </div>

                <motion.div
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                    className="max-w-7xl mx-auto px-6 text-center"
                >
                    <motion.h1
                        variants={fadeUp}
                        className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
                    >
                        Find Affordable Medicines <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-400">
                            Save More. Stay Safe.
                        </span>
                    </motion.h1>

                    <motion.p
                        variants={fadeUp}
                        className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10"
                    >
                        Compare medicine prices, discover generic alternatives, and locate nearby pharmacies with real-time availability.
                    </motion.p>

                    <motion.div
                        variants={fadeUp}
                        className="flex flex-col sm:flex-row justify-center gap-4"
                    >
                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gradient-to-r from-green-500 to-emerald-400 text-white px-8 py-4 rounded-full font-bold shadow-lg"
                        >
                            Search Medicine
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            className="border border-slate-300 px-8 py-4 rounded-full font-bold hover:bg-green-50"
                        >
                            Upload Prescription
                        </motion.button>
                    </motion.div>
                </motion.div>
            </section>

            {/* FEATURES */}
            <section className="py-24 bg-green-50">
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 lg:grid-cols-4 gap-8"
                >
                    {[
                        {
                            title: "Smart Search",
                            desc: "Find medicines and alternatives instantly with AI."
                        },
                        {
                            title: "Generic Options",
                            desc: "Save up to 80% with verified substitutes."
                        },
                        {
                            title: "Price Comparison",
                            desc: "Compare real-time prices across pharmacies."
                        },
                        {
                            title: "Nearby Stores",
                            desc: "Locate medicines available near you instantly."
                        }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            variants={fadeUp}
                            whileHover={{ scale: 1.05 }}
                            className="p-6 rounded-xl bg-white shadow-md hover:shadow-xl transition"
                        >
                            <h3 className="text-xl font-bold mb-2 text-green-600">
                                {item.title}
                            </h3>
                            <p className="text-slate-600">{item.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-24">
                <motion.div
                    variants={stagger}
                    initial="hidden"
                    whileInView="show"
                    className="max-w-6xl mx-auto px-6"
                >
                    <h2 className="text-4xl font-bold text-center mb-16">
                        How It Works
                    </h2>

                    <div className="space-y-12">
                        {[
                            "Scan Your Prescription",
                            "Analyze Alternatives",
                            "Compare Prices",
                            "Choose & Order"
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                className="flex gap-6 items-start"
                            >
                                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                                    {i + 1}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold">{step}</h4>
                                    <p className="text-slate-600">
                                        Intelligent system helps you save money and time.
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* STATS / BENEFITS */}
            <section className="py-24 bg-gradient-to-r from-green-500 to-emerald-400 text-white">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
                >
                    {[
                        { value: "1M+", label: "Users" },
                        { value: "5K+", label: "Pharmacies" },
                        { value: "70%", label: "Savings" },
                        { value: "24/7", label: "Support" }
                    ].map((item, i) => (
                        <div key={i}>
                            <h3 className="text-4xl font-bold">{item.value}</h3>
                            <p>{item.label}</p>
                        </div>
                    ))}
                </motion.div>
            </section>

            {/* CTA */}
            <section className="py-24 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-4xl font-bold mb-6">
                        Ready to Save on Medicines?
                    </h2>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="bg-green-500 text-white px-10 py-4 rounded-full font-bold shadow-lg"
                    >
                        Get Started Now
                    </motion.button>
                </motion.div>
            </section>
        </>
    );
}

export default Landing;