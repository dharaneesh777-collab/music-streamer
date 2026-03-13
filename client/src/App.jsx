import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-800 flex justify-around items-center h-16 z-[60] shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
            {navItems.map(item => (
                <Link key={item.path} to={item.path} className={`flex flex-col items-center text-[10px] transition-colors ${location.pathname === item.path ? 'text-white font-bold' : 'text-gray-400'}`}>
                    <span className="text-xl mb-0.5">{item.icon}</span>
                    {item.label}
                </Link>
            ))}
        </div>
    );
};

function App() {
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        // Check if the HTML global trap already caught the signal
        const checkPrompt = () => {
            if (window.deferredPrompt) {
                setIsInstallable(true);
            }
        };
        
        checkPrompt(); 
        window.addEventListener('pwa-install-ready', checkPrompt);
        
        return () => window.removeEventListener('pwa-install-ready', checkPrompt);
    }, []);

    const handleInstallClick = async () => {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            const { outcome } = await window.deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstallable(false);
                window.deferredPrompt = null;
            }
        }
    };

    return (
        <PlayerProvider>
            <Router>
                <div className="flex h-screen bg-gray-950 text-white overflow-hidden relative">
                    
                    {/* The Install Button renders securely using the trapped signal */}
                    {isInstallable && (
                        <button 
                            onClick={handleInstallClick} 
                            className="fixed top-4 left-4 z-[70] bg-green-600 hover:bg-green-500 text-white text-[10px] md:text-xs font-bold py-1.5 px-3 md:py-2 md:px-4 rounded-full shadow-lg flex items-center gap-1.5 transition active:scale-95 border border-green-500/50"
                        >
                            <span className="text-sm">📱</span> Install App
                        </button>
                    )}

                    <div className="hidden md:flex">
                        <Sidebar />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pb-[130px] md:pb-28">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/search" element={<Search />} />
                            <Route path="/playlists" element={<Playlists />} />
                        </Routes>
                    </div>
                    
                    <div className="fixed top-1/2 right-0 -translate-y-1/2 z-30 pointer-events-none opacity-80 flex items-center justify-center">
                        <div 
                            className="bg-[#2d2a24] text-[#e0b94c] px-1.5 py-4 rounded-l-md shadow-[-4px_0_15px_rgba(0,0,0,0.5)] border border-r-0 border-[#3d3a33] text-[9px] md:text-[11px] font-bold uppercase tracking-[0.2em]"
                            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                        >
                            Website by Dharaneesh
                        </div>
                    </div>

                    <Player />
                    <BottomNav />
                </div>
            </Router>
        </PlayerProvider>
    );
}

export default App;
