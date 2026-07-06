import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
// import NotFound from "../pages/NotFound";
import OrganizerDashboard from "../pages/OrganizerDashboard";
import TeamsPage from "../pages/teams/TeamsPage";
import AddTeam from "../pages/teams/AddTeam";
import TeamDetails from "../pages/teams/TeamDetails";
import EditTeam from "../pages/teams/EditTeam";
import TournamentsPage from "../pages/tournaments/TournamentsPage";
import AddTournament from "../pages/tournaments/AddTournament";
import TournamentDetails from "../pages/tournaments/TournamentDetails";
import EditTournament from "../pages/tournaments/EditTournament";
import PlayersPage from "../pages/players/PlayersPage";
import AddPlayer from "../pages/players/AddPlayer";

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
                <Route path="/teams/:id" element={<TeamDetails />} />
                <Route path="/teams/edit/:id" element={<EditTeam />} />
                <Route path="/tournaments" element={<TournamentsPage />} />
                <Route path="/tournaments/add" element={<AddTournament />} />
                <Route path="/tournaments/:id" element={<TournamentDetails />} />
                <Route path="/tournaments/edit/:id" element={<EditTournament />} />
                <Route path="/players" element={<PlayersPage />} />
                <Route path="/players/add" element={<AddPlayer />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;