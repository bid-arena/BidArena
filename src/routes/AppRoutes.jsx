import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
// import NotFound from "../pages/NotFound";
import OrganizerDashboard from "../pages/OrganizerDashboard";

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />  {/* Home as first page */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {/* <Route path="*" element={<NotFound />} /> */}

                <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;