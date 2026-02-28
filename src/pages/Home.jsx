import React, { useState } from "react";
import { Link } from "react-router-dom";

const Home = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col bg-[#0B0F19] text-white">

            {/* ================= NAVBAR ================= */}
            <nav className="flex justify-between items-center px-6 md:px-12 py-5 border-b border-gray-800">
                <h1 className="text-2xl md:text-3xl font-bold tracking-wide">
                    <span className="text-[#22C55E]">Bid</span>
                    <span className="text-[#FACC15]">Arena</span>
                </h1>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-6">
                    <Link to="/login" className="text-gray-300 hover:text-[#22C55E] transition">
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="bg-[#22C55E] hover:bg-green-600 px-5 py-2 rounded-lg font-semibold transition shadow-md"
                    >
                        Register
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="md:hidden text-gray-300 focus:outline-none"
                >
                    ☰
                </button>
            </nav>

            {/* Mobile Dropdown */}
            {menuOpen && (
                <div className="md:hidden bg-[#111827] flex flex-col items-center py-4 space-y-4 border-b border-gray-800">
                    <Link to="/login" className="hover:text-[#22C55E]">
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="bg-[#22C55E] hover:bg-green-600 px-5 py-2 rounded-lg font-semibold"
                    >
                        Register
                    </Link>
                </div>
            )}

            {/* ================= HERO SECTION ================= */}
            <section className="flex flex-col items-center justify-center text-center flex-1 px-6 md:px-12 py-16 md:py-24">
                <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold leading-tight">
                    Build Your Dream Team
                    <br />
                    <span className="text-[#22C55E]">In Real-Time Auctions</span>
                </h2>

                <p className="mt-6 text-gray-400 max-w-xl md:max-w-2xl text-sm sm:text-base md:text-lg">
                    BidArena is a next-generation cricket auction platform designed for
                    tournaments, leagues, and franchise competitions. Experience
                    real-time bidding, live countdowns, purse tracking, and analytics —
                    all in one place.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <Link
                        to="/register"
                        className="bg-[#22C55E] hover:bg-green-600 px-8 py-3 rounded-xl font-semibold text-lg transition shadow-lg"
                    >
                        Get Started
                    </Link>
                    <Link
                        to="/live-auction"
                        className="border border-[#22C55E] px-8 py-3 rounded-xl font-semibold text-lg hover:bg-[#22C55E] hover:text-black transition"
                    >
                        View Live Auction
                    </Link>
                </div>
            </section>

            {/* ================= FEATURES ================= */}
            <section className="px-6 md:px-12 py-16 bg-[#0F172A]">
                <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">
                    Powerful Auction Features
                </h3>

                <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">

                    <div className="bg-[#1E293B] p-6 rounded-2xl shadow-lg hover:scale-105 transition">
                        <h4 className="text-xl font-semibold text-[#22C55E]">
                            Real-Time Bidding
                        </h4>
                        <p className="text-gray-400 mt-3 text-sm md:text-base">
                            Instant bid updates with live synchronization across all participants.
                        </p>
                    </div>

                    <div className="bg-[#1E293B] p-6 rounded-2xl shadow-lg hover:scale-105 transition">
                        <h4 className="text-xl font-semibold text-[#22C55E]">
                            Smart Purse Tracking
                        </h4>
                        <p className="text-gray-400 mt-3 text-sm md:text-base">
                            Automatically calculate remaining budgets and enforce bidding rules.
                        </p>
                    </div>

                    <div className="bg-[#1E293B] p-6 rounded-2xl shadow-lg hover:scale-105 transition">
                        <h4 className="text-xl font-semibold text-[#22C55E]">
                            Analytics Dashboard
                        </h4>
                        <p className="text-gray-400 mt-3 text-sm md:text-base">
                            Track most expensive players, team stats, and auction history.
                        </p>
                    </div>

                </div>
            </section>

            {/* ================= CTA ================= */}
            <section className="bg-[#22C55E] py-16 text-center px-6">
                <h3 className="text-2xl md:text-3xl font-bold text-black">
                    Ready to Host Your Own Cricket Auction?
                </h3>

                <p className="mt-4 text-base md:text-lg text-black/80">
                    Join thousands of organizers building competitive leagues.
                </p>

                <Link
                    to="/register"
                    className="inline-block mt-6 bg-black hover:bg-gray-900 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition"
                >
                    Create Account
                </Link>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="text-center text-gray-500 py-6 border-t border-gray-800 text-sm">
                © {new Date().getFullYear()} BidArena. All Rights Reserved.
            </footer>

        </div>
    );
};

export default Home;