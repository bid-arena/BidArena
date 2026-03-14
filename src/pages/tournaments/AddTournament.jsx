import React, { useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import { createTournament } from "../../services/tournamentService";
import { useNavigate } from "react-router-dom";

const AddTournament = () => {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        location: "",
        date: "",
        purseAmount: ""
    });

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm({
            ...form,
            [name]: value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await createTournament(form);

            alert("Tournament created successfully!");

            navigate("/tournaments");

        } catch (error) {

            console.log(error);

            alert("Failed to create tournament");

        }

    };

    return (

        <div className="min-h-screen flex bg-[#0A0F2C]">

            <Sidebar />

            <main className="flex-1 p-10 text-white">

                <h1 className="text-3xl font-bold mb-8">
                    Create Tournament
                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="bg-[#0F1E4D] p-8 rounded-xl max-w-xl space-y-6"
                >

                    <input
                        name="name"
                        placeholder="Tournament Name"
                        required
                        onChange={handleChange}
                        className="w-full p-3 rounded bg-[#001F54]"
                    />

                    <input
                        name="location"
                        placeholder="Location"
                        required
                        onChange={handleChange}
                        className="w-full p-3 rounded bg-[#001F54]"
                    />

                    <input
                        type="date"
                        name="date"
                        required
                        onChange={handleChange}
                        className="w-full p-3 rounded bg-[#001F54]"
                    />

                    <input
                        name="purseAmount"
                        type="number"
                        placeholder="Total Purse Amount"
                        required
                        onChange={handleChange}
                        className="w-full p-3 rounded bg-[#001F54]"
                    />

                    <button
                        type="submit"
                        className="bg-[#FDB913] px-6 py-3 rounded text-black font-semibold w-full"
                    >
                        Create Tournament
                    </button>

                </form>

            </main>

        </div>

    );

};

export default AddTournament;