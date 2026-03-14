import { Link } from "react-router-dom";

const Sidebar = () => {

    return (
        <aside className="w-64 bg-[#001F54] p-6 hidden md:block">

            <h2 className="text-2xl font-bold text-[#FDB913] mb-10">
                BidArena
            </h2>

            <nav className="space-y-6 text-white">

                <Link to="/organizer-dashboard" className="block hover:text-[#FDB913]">
                    Dashboard
                </Link>

                <Link to="/tournaments" className="block hover:text-[#FDB913]">
                    Tournaments
                </Link>

                <Link to="/teams" className="block hover:text-[#FDB913]">
                    Teams
                </Link>

                <Link to="/players" className="block hover:text-[#FDB913]">
                    Players
                </Link>

                <Link to="/auctions" className="block hover:text-[#FDB913]">
                    Auctions
                </Link>

            </nav>

        </aside>
    );
};

export default Sidebar;