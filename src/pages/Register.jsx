import React from "react";
import RegisterForm from "../features/auth/RegisterForm";

const Register = () => {
    return (
        <div className="min-h-screen bg-[#0A0F2C] flex items-center justify-center px-4 relative overflow-hidden">

            {/* Background Glow */}
            <div className="absolute w-[600px] h-[600px] bg-[#00E676] blur-[200px] opacity-10 rounded-full -top-20 -left-20"></div>

            <div className="relative z-10 w-full max-w-6xl grid md:grid-cols-2 bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

                {/* Left Panel */}
                <div className="hidden md:flex flex-col justify-center p-12 bg-[#001F54]">
                    <h2 className="text-4xl font-bold leading-tight text-white">
                        Start Managing <br />
                        <span className="text-[#FDB913]">Your Cricket Auction</span>
                    </h2>

                    <p className="text-[#B0B8D1] mt-6">
                        Create teams, register owners, upload players, and control
                        the entire auction from a powerful organizer dashboard.
                    </p>
                </div>

                {/* Right Panel (Form Side) */}
                <div className="bg-[#0F1E4D] p-8 md:p-12 text-white">
                    <RegisterForm />
                </div>

            </div>
        </div>
    );
};

export default Register;