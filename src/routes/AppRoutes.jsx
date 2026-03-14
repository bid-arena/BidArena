import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
// import NotFound from "../pages/NotFound";
import OrganizerDashboard from "../pages/OrganizerDashboard";
import TeamsPage from "../pages/teams/TeamsPage";
import AddTeam from "../pages/teams/AddTeam";
import TournamentsPage from "../pages/tournaments/TournamentsPage";
import AddTournament from "../pages/tournaments/AddTournament";

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />  {/* Home as first page */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                {/* <Route path="*" element={<NotFound />} /> */}

                <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/teams/add" element={<AddTeam />} />
                <Route path="/tournaments" element={<TournamentsPage />} />
                <Route path="/tournaments/add" element={<AddTournament />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;