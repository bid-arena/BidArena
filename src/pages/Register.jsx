import React from "react";
import RegisterForm from "../features/auth/RegisterForm";

const Register = () => {
    return (
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4 relative overflow-hidden">

            {/* Subtle background glow */}
            <div className="absolute w-[500px] h-[500px] bg-[#FACC15] blur-[180px] opacity-10 rounded-full -top-20 -left-20"></div>

            <div className="relative z-10 w-full max-w-6xl grid md:grid-cols-2 bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

                {/* Left Panel */}
                <div className="hidden md:flex flex-col justify-center p-12 bg-[#111827]">
                    <h2 className="text-4xl font-bold leading-tight text-white">
                        Build & Manage <br />
                        <span className="text-[#FACC15]">
                            Cricket Tournaments Professionally
                        </span>
                    </h2>

                    <p className="text-gray-400 mt-6">
                        Register as an organizer to create tournaments, manage teams,
                        assign captains, and control players — all from one secure dashboard.
                    </p>
                </div>

                {/* Right Panel */}
                <div className="bg-[#1F2937] p-8 md:p-12 text-white">
                    <RegisterForm />
                </div>
            </div>
        </div>
    );
};

export default Register;