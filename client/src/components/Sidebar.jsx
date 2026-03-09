import { Link } from 'react-router-dom';

const Sidebar = () => {
    return (
        <div className="w-64 bg-gray-950 h-full p-6 flex flex-col gap-6 border-r border-gray-800">
            <div className="text-2xl font-bold text-white mb-4">Streamer</div>
            <nav className="flex flex-col gap-4">
                <Link to="/" className="text-gray-400 hover:text-white transition font-semibold">🏠 Home</Link>
                <Link to="/search" className="text-gray-400 hover:text-white transition font-semibold">🔍 Search</Link>
                <Link to="/playlists" className="text-gray-400 hover:text-white transition font-semibold">📚 Playlists</Link>
            </nav>
        </div>
    );
};

export default Sidebar;
