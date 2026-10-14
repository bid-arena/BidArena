import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
    return (
        <div className="bg-[#0B1120] text-white min-h-screen select-none">

            <nav className="flex justify-between items-center px-8 py-5 border-b border-gray-800">
                <h1 className="text-2xl font-bold text-yellow-400">
                    BidArena
                </h1>

                <div className="flex items-center gap-6">
                    <Link
                        to="/login"
                        className="text-gray-300 hover:text-yellow-400 transition duration-300"
                    >
                        Login
                    </Link>
                    <Link
                        to="/register"
                        className="bg-yellow-400 text-black px-5 py-2 rounded-xl font-semibold hover:bg-yellow-300 transition duration-300"
                    >
                        Register Organizer
                    </Link>
                </div>
            </nav>

            <section className="flex flex-col lg:flex-row items-center justify-between px-10 lg:px-24 py-20">

                <div className="max-w-xl">
                    <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                        Smart Cricket Tournament
                        <span className="text-yellow-400"> Management Platform</span>
                    </h2>

                    <p className="text-gray-400 mt-6 text-lg">
                        Organize tournaments, manage teams, assign captains,
                        and control player registrations — all from one
                        professional dashboard.
                    </p>

                    <div className="flex flex-wrap gap-4 mt-8">
                        <Link
                            to="/demo-auction"
                            className="bg-gradient-to-r from-yellow-400 to-[#D4AF37] text-black px-6 py-3 rounded-2xl font-black hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg shadow-yellow-500/20"
                        >
                            Enter Live Auction Demo 🏆
                        </Link>

                        <Link
                            to="/register"
                            className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-white/10 transition duration-300"
                        >
                            Get Started
                        </Link>

                        <Link
                            to="/login"
                            className="border border-yellow-400 px-6 py-3 rounded-2xl text-yellow-400 hover:bg-yellow-400 hover:text-black transition duration-300"
                        >
                            Login
                        </Link>
                    </div>
                </div>

                <div className="mt-14 lg:mt-0">
                    <div className="bg-[#111827] p-6 rounded-3xl shadow-2xl shadow-black/40 backdrop-blur-lg border border-gray-700 w-[350px]">
                        <h3 className="text-lg font-semibold text-yellow-400 mb-4">
                            Dashboard Preview
                        </h3>
                        <div className="space-y-3">
                            <div className="bg-[#1F2937] p-3 rounded-lg flex justify-between">
                                <span className="text-gray-400">Total Teams</span>
                                <span className="font-bold">12</span>
                            </div>
                            <div className="bg-[#1F2937] p-3 rounded-lg flex justify-between">
                                <span className="text-gray-400">Registered Players</span>
                                <span className="font-bold">156</span>
                            </div>
                            <div className="bg-[#1F2937] p-3 rounded-lg flex justify-between">
                                <span className="text-gray-400">Active Tournaments</span>
                                <span className="font-bold">3</span>
                            </div>
                        </div>
                    </div>
                </div>

            </section>

            <section className="px-10 lg:px-24 py-16 bg-[#111827]">
                <h2 className="text-3xl font-bold text-center mb-12">
                    Platform Features
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                    <div className="bg-[#1F2937] p-8 rounded-2xl border border-gray-700 hover:border-yellow-400 transition duration-300">
                        <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                            Organizer Control
                        </h3>
                        <p className="text-gray-400">
                            Create tournaments, manage teams, assign captains
                            and handle player registrations seamlessly.
                        </p>
                    </div>

                    <div className="bg-[#1F2937] p-8 rounded-2xl border border-gray-700 hover:border-yellow-400 transition duration-300">
                        <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                            Team & Player Management
                        </h3>
                        <p className="text-gray-400">
                            Structured team allocation, role-based players,
                            and real-time management dashboard.
                        </p>
                    </div>

                    <div className="bg-[#1F2937] p-8 rounded-2xl border border-gray-700 hover:border-yellow-400 transition duration-300">
                        <h3 className="text-xl font-semibold text-yellow-400 mb-3">
                            Secure Role Access
                        </h3>
                        <p className="text-gray-400">
                            Controlled access for Organizer, Captain,
                            and Player with secure authentication.
                        </p>
                    </div>
                </div>
            </section>

            <section className="px-10 lg:px-24 py-20 text-center">
                <h2 className="text-3xl font-bold">
                    Ready to Organize Your Tournament Professionally?
                </h2>
                <Link
                    to="/register"
                    className="inline-block mt-8 bg-yellow-400 text-black px-8 py-3 rounded-2xl font-semibold hover:bg-yellow-300 transition duration-300 shadow-lg shadow-yellow-500/20"
                >
                    Register as Organizer
                </Link>
            </section>

            {/* ================= FOOTER ================= */}
            <footer className="text-center py-6 border-t border-gray-800 text-gray-500 text-sm">
                © 2026 BidArena. All rights reserved.
            </footer>
        </div>
    );
}