import React from "react";

const TableCard = ({ title, children }) => (
    <div className="bg-[#0F1E4D] rounded-xl p-6 mb-10 shadow-lg">

        <h2 className="text-xl font-semibold mb-4">
            {title}
        </h2>

        <div className="overflow-x-auto">
            {children}
        </div>

    </div>
);

export default TableCard;
