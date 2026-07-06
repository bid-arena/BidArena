import React from "react";
import { Link } from "react-router-dom";

const ActionButton = ({ title, link, color }) => (
    <Link
        to={link}
        className={`py-3 rounded-lg text-center font-semibold transition hover:scale-105 ${color}`}
    >
        {title}
    </Link>
);

export default ActionButton;
