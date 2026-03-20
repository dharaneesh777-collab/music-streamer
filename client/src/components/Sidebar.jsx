import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Home', icon: '🏠' },
        { path: '/search', label: 'Search', icon: '🔍' },
        { path: '/status', label: 'Status', icon: '📱' },
        { path: '/playlists', label: 'Playlists', icon: '📚' }
    ];

    return (
        <div className="w-64 bg-gray-950 h-full border-r border-gray-800 flex flex-col hidden md:flex">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    Streamer
                </h2>
            </div>
            
            <nav className="flex-1 px-4 py-4 space-y-2">
                {navItems.map(item => (
                    <Link 
                        key={item.path} 
                        to={item.path} 
                        className={`flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${location.pathname === item.path ? 'bg-gray-800 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                    >
                        <span className="text-xl">{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-6 border-t border-gray-800">
                <p className="text-xs text-gray-500 font-medium">v2.4.0 Engine Active</p>
            </div>
        </div>
    );
};

export default Sidebar;
