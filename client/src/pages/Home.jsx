import { useEffect, useState, useContext } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { API_BASE_URL } from '../config';

const cleanText = (str) => str ? str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'") : '';
const LANGUAGES = ['All', 'English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam'];

const Home = () => {
    const [trending, setTrending] = useState([]);
    const [activeLang, setActiveLang] = useState(localStorage.getItem('preferred_lang') || 'All');
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);
    const { playTrack } = useContext(PlayerContext);

    useEffect(() => {
        localStorage.setItem('preferred_lang', activeLang);
        setError(null);

        // UPGRADED: Caching Layer to instantly render UI while bypassing cold starts
        const cacheKey = `streamer_cache_${activeLang}`;
        const cachedData = sessionStorage.getItem(cacheKey);

        if (cachedData) {
            setTrending(JSON.parse(cachedData));
            setLoading(false); // Disable loading animation instantly
        } else {
            setTrending([]);
            setLoading(true);
        }

        // Silent background network fetch (Stale-While-Revalidate pattern)
        fetch(`${API_BASE_URL}/api/trending?lang=${activeLang}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    setTrending(data.data);
                    sessionStorage.setItem(cacheKey, JSON.stringify(data.data)); // Update cache quietly
                } else if (!cachedData) {
                    setError("Failed to load tracks.");
                }
                setLoading(false); 
            })
            .catch(err => {
                if (!cachedData) setError("Network error connecting to backend.");
                setLoading(false);
            });
    }, [activeLang]);

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Trending Now</h1>
            
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 mb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {LANGUAGES.map(lang => (
                    <button key={lang} onClick={() => setActiveLang(lang)} className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition flex-shrink-0 border ${activeLang === lang ? 'bg-green-600 text-white border-green-500' : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>
                        {lang}
                    </button>
                ))}
            </div>

            {error && <div className="text-red-400 mb-6 bg-red-900/20 p-4 rounded text-sm">{error}</div>}
            
            {loading && !error && <p className="text-gray-400 text-sm animate-pulse">Loading charts...</p>}
            {!loading && trending.length === 0 && !error && <p className="text-gray-400 text-sm">No specific hits found for this language at the moment.</p>}
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6 pb-20">
                {trending.map(track => (
                    <div key={track.id} className="bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition active:scale-[0.98]" onClick={() => playTrack(track, trending)}>
                        <div className="relative mb-3">
                            <img src={track.cover} alt="cover" className="w-full aspect-square object-cover rounded shadow-lg" loading="lazy" />
                        </div>
                        <h3 className="text-[11px] md:text-sm font-semibold truncate">{cleanText(track.title)}</h3>
                        <p className="text-[9px] md:text-xs text-gray-400 truncate">{cleanText(track.artist)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default Home;
