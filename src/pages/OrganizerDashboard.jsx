import React from "react";

const OrganizerDashboard = () => {
    return (
        <div className="min-h-screen bg-[#0A0F2C] flex">

            {/* Sidebar */}
            <aside className="w-64 bg-[#001F54] p-6 hidden md:block">
                <h2 className="text-2xl font-bold text-[#FDB913] mb-10">
                    BidArena
                </h2>

                <nav className="space-y-6 text-white">
                    <p className="hover:text-[#FDB913] cursor-pointer transition">
                        Dashboard
                    </p>
                    <p className="hover:text-[#FDB913] cursor-pointer transition">
                        Teams
                    </p>
                    <p className="hover:text-[#FDB913] cursor-pointer transition">
                        Players
                    </p>
                    <p className="hover:text-[#FDB913] cursor-pointer transition">
                        Auctions
                    </p>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">

                <h1 className="text-3xl font-bold text-white mb-8">
                    Welcome Organizer 👋
                </h1>

                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6">

                    <div className="bg-[#0F1E4D] p-6 rounded-2xl border border-white/10">
                        <h3 className="text-[#B0B8D1] text-sm">Total Teams</h3>
                        <p className="text-3xl font-bold text-[#FDB913] mt-3">0</p>
                    </div>

                    <div className="bg-[#0F1E4D] p-6 rounded-2xl border border-white/10">
                        <h3 className="text-[#B0B8D1] text-sm">Registered Players</h3>
                        <p className="text-3xl font-bold text-[#00E676] mt-3">0</p>
                    </div>

                    <div className="bg-[#0F1E4D] p-6 rounded-2xl border border-white/10">
                        <h3 className="text-[#B0B8D1] text-sm">Active Auctions</h3>
                        <p className="text-3xl font-bold text-white mt-3">0</p>
                    </div>

                </div>

                {/* Quick Actions */}
                <div className="mt-10">
                    <h2 className="text-xl text-white font-semibold mb-6">
                        Quick Actions
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        <button className="bg-gradient-to-r from-[#00E676] to-[#00C853] text-black font-semibold py-3 rounded-xl hover:scale-105 transition">
                            Add Team
                        </button>

                        <button className="bg-[#FDB913] text-black font-semibold py-3 rounded-xl hover:scale-105 transition">
                            Add Player
                        </button>

                        <button className="bg-[#0F1E4D] border border-[#FDB913] text-[#FDB913] font-semibold py-3 rounded-xl hover:bg-[#FDB913] hover:text-black transition">
                            Start Auction
                        </button>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default OrganizerDashboard;