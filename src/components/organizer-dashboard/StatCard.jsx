import React from "react";

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-[#0F1E4D] p-6 rounded-xl border border-white/10 flex items-center gap-4 hover:scale-105 hover:shadow-xl transition">

        <div className={`p-3 rounded-lg bg-white/10 ${color}`}>
            {icon}
        </div>

        <div>
            <p className="text-gray-400 text-sm">{title}</p>
            <h2 className="text-3xl font-bold mt-1">{value}</h2>
        </div>

    </div>
);

export default StatCard;
