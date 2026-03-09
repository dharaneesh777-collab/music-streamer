import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Player from './components/Player';
import Home from './pages/Home';
import Search from './pages/Search';
import Playlists from './pages/Playlists';
import { PlayerProvider } from './context/PlayerContext';

const BottomNav = () => {
    const location = useLocation();
    const navItems = [
        { path: '/', label: 'Home', icon: '🏠' },
        { path: '/search', label: 'Search', icon: '🔍' },
        { path: '/playlists', label: 'Playlists', icon: '📚' }
    ];

    return (
        <div className="md:hidden fixed bottom-24 w-full bg-gray-900 border-t border-gray-800 flex justify-around items-center py-3 z-40">
            {navItems.map(item => (
                <Link key={item.path} to={item.path} className={`flex flex-col items-center text-xs ${location.pathname === item.path ? 'text-white font-bold' : 'text-gray-400'}`}>
                    <span className="text-xl mb-1">{item.icon}</span>
                    {item.label}
                </Link>
            ))}
        </div>
    );
};

function App() {
    return (
        <PlayerProvider>
            <Router>
                <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
                    {/* Sidebar hidden on mobile, visible on medium+ screens */}
                    <div className="hidden md:flex">
                        <Sidebar />
                    </div>
                    
                    {/* Added bottom padding on mobile to prevent content hiding behind bottom nav & player */}
                    <div className="flex-1 overflow-y-auto pb-44 md:pb-28">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/search" element={<Search />} />
                            <Route path="/playlists" element={<Playlists />} />
                        </Routes>
                    </div>
                    
                    <BottomNav />
                    <Player />
                </div>
            </Router>
        </PlayerProvider>
    );
}

export default App;
