import React, { useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddPlayer = () => {

    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        role: "",
        basePrice: "",
        image: ""
    });

    const API_URL = "http://localhost:5000/api/players";

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await axios.post(API_URL, form);
            alert("Player added successfully!");
            navigate("/players");
        } catch (err) {
            console.log(err);
            alert("Error adding player");
        }
    };

    return (

        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-[#0A0F2C] to-[#020617] text-white">

            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 md:p-8">

                <h1 className="text-2xl md:text-3xl font-bold mb-6">
                    Add Player
                </h1>

                <form
                    onSubmit={handleSubmit}
                    className="max-w-xl bg-[#0F1E4D] p-6 rounded-xl space-y-4"
                >

                    <input
                        type="text"
                        name="name"
                        placeholder="Player Name"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded bg-[#08163A]"
                        required
                    />

                    <input
                        type="text"
                        name="role"
                        placeholder="Role (Batsman/Bowler)"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded bg-[#08163A]"
                        required
                    />

                    <input
                        type="number"
                        name="basePrice"
                        placeholder="Base Price"
                        value={form.basePrice}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded bg-[#08163A]"
                        required
                    />

                    <input
                        type="text"
                        name="image"
                        placeholder="Image URL"
                        value={form.image}
                        onChange={handleChange}
                        className="w-full px-4 py-2 rounded bg-[#08163A]"
                    />

                    <button
                        type="submit"
                        className="w-full bg-[#FDB913] py-2 rounded text-black font-semibold"
                    >
                        Add Player
                    </button>

                </form>

            </main>

        </div>
    );
};

export default AddPlayer;
