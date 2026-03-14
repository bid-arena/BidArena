import React, { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { getTournaments } from "../../services/tournamentService";
import { Link } from "react-router-dom";

const TournamentsPage = () => {

    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTournaments = async () => {

        try {

            const data = await getTournaments();
            setTournaments(data);

        } catch (error) {

            console.log("Tournament fetch error:", error);

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {
        fetchTournaments();
    }, []);

    return (

        <div className="min-h-screen flex bg-[#0A0F2C]">

            <Sidebar />

            <main className="flex-1 p-8 text-white">

                <div className="flex justify-between items-center mb-8">

                    <h1 className="text-3xl font-bold">
                        Tournament Management
                    </h1>

                    <Link
                        to="/tournaments/add"
                        className="bg-[#FDB913] px-5 py-2 rounded-lg text-black font-semibold"
                    >
                        + Create Tournament
                    </Link>

                </div>

                <div className="bg-[#0F1E4D] rounded-xl overflow-hidden">

                    <table className="w-full text-left">

                        <thead className="bg-[#001F54]">

                            <tr>
                                <th className="p-4">Name</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Purse Amount</th>
                                <th className="p-4">Created</th>
                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>
                                    <td colSpan="5" className="p-6 text-center">
                                        Loading tournaments...
                                    </td>
                                </tr>

                            ) : tournaments.length === 0 ? (

                                <tr>
                                    <td colSpan="5" className="p-6 text-center">
                                        No tournaments found
                                    </td>
                                </tr>

                            ) : (

                                tournaments.map((t) => (

                                    <tr key={t.id} className="border-t border-white/10">

                                        <td className="p-4 font-semibold">
                                            {t.name}
                                        </td>

                                        <td className="p-4">
                                            {t.location}
                                        </td>

                                        <td className="p-4">
                                            {new Date(t.date).toLocaleDateString()}
                                        </td>

                                        <td className="p-4 text-green-400 font-bold">
                                            ₹{t.purseAmount.toLocaleString()}
                                        </td>

                                        <td className="p-4 text-gray-400">
                                            {new Date(t.createdAt).toLocaleDateString()}
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

export default TournamentsPage;