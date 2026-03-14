import React, { useEffect, useState } from "react";
import { getTeams, deleteTeam } from "../../services/teamService";
import Sidebar from "../../components/layout/Sidebar";
import { Link } from "react-router-dom";

const TeamsPage = () => {

    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTeams = async () => {

        try {

            const data = await getTeams();
            setTeams(data);

        } catch (error) {

            console.log("Teams fetch error:", error);

        }

    };

    useEffect(() => {

        const loadTeams = async () => {

            try {

                const data = await getTeams();
                setTeams(data);

            } catch (error) {

                console.log(error);

            } finally {

                setLoading(false);

            }

        };

        loadTeams();

    }, []);

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm("Delete this team?");

        if (!confirmDelete) return;

        await deleteTeam(id);

        fetchTeams();

    };

    return (

        <div className="min-h-screen flex bg-[#0A0F2C]">

            <Sidebar />

            <main className="flex-1 p-8 text-white">

                <div className="flex justify-between items-center mb-8">

                    <h1 className="text-3xl font-bold">
                        Teams Management
                    </h1>

                    <Link
                        to="/teams/add"
                        className="bg-[#FDB913] px-5 py-2 rounded-lg text-black font-semibold"
                    >
                        + Add Team
                    </Link>

                </div>

                <div className="bg-[#0F1E4D] rounded-xl overflow-hidden">

                    <table className="w-full text-left">

                        <thead className="bg-[#001F54]">
                            <tr>
                                <th className="p-4">Team</th>
                                <th className="p-4">Captain</th>
                                <th className="p-4">Tournament</th>
                                <th className="p-4">Purse</th>
                                <th className="p-4">Remaining</th>
                                <th className="p-4">Created</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>
                                    <td colSpan="7" className="p-6 text-center">
                                        Loading teams...
                                    </td>
                                </tr>

                            ) : teams.length === 0 ? (

                                <tr>
                                    <td colSpan="7" className="p-6 text-center">
                                        No teams found
                                    </td>
                                </tr>

                            ) : (
                                teams.map((team) => (

                                    <tr
                                        key={team.id}
                                        className="border-t border-white/10"
                                    >

                                        <td className="p-4 flex items-center gap-3">

                                            <img
                                                src={team.logo}
                                                className="w-10 h-10 rounded-full"
                                            />

                                            {team.name}

                                        </td>

                                        <td className="p-4">
                                            {team.captainName}
                                        </td>

                                        <td className="p-4">
                                            {team.tournament?.name}
                                        </td>

                                        <td className="p-4 text-green-400 font-bold">
                                            ₹{team.purseAmount.toLocaleString()}
                                        </td>

                                        <td className="p-4 text-yellow-400 font-bold">
                                            ₹{team.remainingPurse.toLocaleString()}
                                        </td>

                                        <td className="p-4 text-gray-400">
                                            {new Date(team.createdAt).toLocaleDateString()}
                                        </td>

                                        <td className="p-4 flex gap-3">

                                            <Link
                                                to={`/teams/edit/${team.id}`}
                                                className="bg-blue-500 px-3 py-1 rounded"
                                            >
                                                Edit
                                            </Link>

                                            <button
                                                onClick={() => handleDelete(team.id)}
                                                className="bg-red-500 px-3 py-1 rounded"
                                            >
                                                Delete
                                            </button>

                                        </td>

                                    </tr>

                                ))
                            )}

                        </tbody>

                    </table>

                </div>

            </main>

        </div>

    );
};

export default TeamsPage;