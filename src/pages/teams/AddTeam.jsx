import React, { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AddTeam = () => {

    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: "",
        captainName: "",
        tournamentId: "",
        logo: null
    });

    const [tournaments, setTournaments] = useState([]);
    const [preview, setPreview] = useState(null);

    useEffect(() => {

        const loadTournaments = async () => {

            try {

                const token = localStorage.getItem("token");

                const res = await axios.get(
                    "http://localhost:5000/api/tournaments",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setTournaments(res.data.data);

            } catch (error) {
                console.log(`Error: ${error.message}`);
                toast.error("Failed to load tournaments");

            }

        };

        loadTournaments();

    }, []);

    const handleChange = (e) => {

        const { name, value, files } = e.target;

        if (files) {

            const file = files[0];

            setForm({ ...form, logo: file });
            setPreview(URL.createObjectURL(file));

        } else {

            setForm({ ...form, [name]: value });

        }

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            setLoading(true);

            const formData = new FormData();

            formData.append("name", form.name);
            formData.append("captainName", form.captainName);
            formData.append("tournamentId", form.tournamentId);

            if (form.logo) {
                formData.append("logo", form.logo);
            }

            const token = localStorage.getItem("token");

            await axios.post(
                "http://localhost:5000/api/teams/create",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            toast.success("Team created successfully!");

            setTimeout(() => {
                navigate("/teams");
            }, 1200);

        } catch (error) {
            console.log(`Error: ${error.message}`);
            toast.error("Failed to create team");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="min-h-screen flex bg-[#0A0F2C]">

            <Sidebar />

            <main className="flex-1 p-10 text-white">

                <h1 className="text-3xl font-bold mb-8">
                    Add New Team
                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="bg-[#0F1E4D] p-8 rounded-xl max-w-xl space-y-6 shadow-lg"
                >

                    {/* Team Name */}
                    <input
                        name="name"
                        placeholder="Team Name"
                        required
                        onChange={handleChange}
                        className="w-full p-3 rounded bg-[#001F54] focus:outline-none"
                    />

                    {/* Captain */}
                    <input
                        name="captainName"
                        placeholder="Captain Name"
                        required
                        onChange={handleChange}
                        className="w-full p-3 rounded bg-[#001F54] focus:outline-none"
                    />

                    {/* Tournament */}
                    <select
                        name="tournamentId"
                        required
                        onChange={handleChange}
                        className="w-full p-3 rounded bg-[#001F54]"
                    >

                        <option value="">Select Tournament</option>

                        {tournaments.map((t) => (

                            <option key={t.id} value={t.id}>
                                {t.name} ({t.location})
                            </option>

                        ))}

                    </select>

                    {/* Logo Upload */}
                    <input
                        type="file"
                        name="logo"
                        accept="image/*"
                        onChange={handleChange}
                        className="text-sm"
                    />

                    {/* Image Preview Card */}
                    {preview && (

                        <div className="bg-[#001F54] p-4 rounded-lg flex items-center gap-4">

                            <img
                                src={preview}
                                alt="preview"
                                className="w-20 h-20 rounded-full object-cover border-2 border-yellow-400"
                            />

                            <div>

                                <p className="text-sm text-gray-300">
                                    Logo Preview
                                </p>

                                <p className="text-xs text-gray-400">
                                    {form.logo?.name}
                                </p>

                            </div>

                        </div>

                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#FDB913] px-6 py-3 rounded text-black font-semibold w-full hover:opacity-90"
                    >

                        {loading ? "Creating..." : "Create Team"}

                    </button>

                </form>

            </main>

        </div>

    );
};

export default AddTeam;