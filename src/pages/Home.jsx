import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
    return (
        <div className="min-h-screen w-full bg-[#0A0F2C] text-white overflow-x-hidden">

            {/* Navbar */}
            <nav className="flex justify-between items-center px-6 md:px-14 py-6 border-b border-white/10 backdrop-blur-md bg-white/5">
                <h1 className="text-3xl font-extrabold">
                    <span className="text-[#00E676]">Bid</span>
                    <span className="text-[#FDB913]">Arena</span>
                </h1>

                <Link
                    to="/register"
                    className="bg-gradient-to-r from-[#FDB913] to-[#FF9800] text-black px-6 py-2 rounded-full font-semibold shadow-lg hover:scale-105 transition"
                >
                    Organizer Login
                </Link>
            </nav>

            {/* Hero Section */}
            <section className="flex flex-col items-center text-center px-6 py-24 relative">

                <div className="absolute w-[500px] h-[500px] bg-[#00E676] blur-[180px] opacity-10 rounded-full"></div>

                <h2 className="text-4xl md:text-6xl font-extrabold leading-tight relative z-10">
                    Host & Manage
                    <br />
                    <span className="bg-gradient-to-r from-[#FDB913] to-[#00E676] bg-clip-text text-transparent">
                        Your Own Cricket Auction
                    </span>
                </h2>

                <p className="mt-6 text-gray-300 max-w-2xl text-lg relative z-10">
                    BidArena gives organizers complete control to create auctions,
                    register teams, manage owners, and upload player lists —
                    all from one powerful dashboard.
                </p>

                <div className="mt-10 relative z-10">
                    <Link
                        to="/register"
                        className="bg-gradient-to-r from-[#00E676] to-[#00C853] px-10 py-4 rounded-full font-bold text-black shadow-xl hover:scale-105 transition"
                    >
                        Create Organizer Account
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className="px-6 md:px-14 py-20 bg-[#001F54]">
                <h3 className="text-3xl md:text-4xl font-bold text-center mb-14">
                    Organizer Dashboard Features
                </h3>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">

                    {[
                        "Create & Configure Auction",
                        "Add Teams & Team Owners",
                        "Upload Player List",
                        "Control Live Bidding",
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl hover:-translate-y-2 transition"
                        >
                            <h4 className="text-lg font-bold text-[#FDB913]">
                                {item}
                            </h4>
                        </div>
                    ))}

                </div>
            </section>

            {/* CTA */}
            <section className="py-20 text-center bg-gradient-to-r from-[#FDB913] to-[#FF6F00] text-black">
                <h3 className="text-3xl font-bold">
                    Start Organizing Your Auction Today
                </h3>

                <Link
                    to="/register"
                    className="inline-block mt-8 bg-black text-white px-10 py-4 rounded-full font-semibold shadow-lg hover:scale-105 transition"
                >
                    Register as Organizer
                </Link>
            </section>

            <footer className="text-center py-6 text-gray-400 border-t border-white/10">
                © {new Date().getFullYear()} BidArena Organizer Platform
            </footer>
        </div>
    );
};

export default Home;