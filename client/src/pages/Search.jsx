import { useState, useContext, useEffect } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { API_BASE_URL } from '../config';

const cleanText = (str) => str ? str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'") : '';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { playTrack } = useContext(PlayerContext);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.trim()) {
                setLoading(true);
                setError(null);
                fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.success && Array.isArray(data.data)) {
                            setResults(data.data);
                        } else {
                            setResults([]);
                            setError("Unable to find tracks.");
                        }
                        setLoading(false);
                    })
                    .catch(err => {
                        console.error(err);
                        setResults([]);
                        setError("Network error connecting to the backend server.");
                        setLoading(false);
                    });
            } else {
                setResults([]);
                setError(null);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Search</h1>
            <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search songs, movies, or anime..." 
                className="w-full max-w-md bg-gray-800 text-white rounded-full py-2.5 md:py-3 px-5 md:px-6 mb-6 md:mb-8 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm md:text-base shadow-inner"
            />
            {loading && <p className="text-sm md:text-base text-gray-400 mb-4 animate-pulse">Searching the database...</p>}
            {error && <div className="text-red-400 mb-6 bg-red-900/20 p-4 rounded border border-red-900 text-sm md:text-base">{error}</div>}
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
                {results.map(track => (
                    <div 
                        key={track.id} 
                        className="bg-gray-800 p-3 md:p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition active:scale-[0.98]"
                        onClick={() => playTrack(track, results)}
                    >
                        <div className="relative mb-3 md:mb-4">
                            <img src={track.cover} alt="cover" className="w-full aspect-square object-cover rounded shadow-lg" />
                            <span className={`absolute top-1 right-1 md:top-2 md:right-2 text-[8px] md:text-[10px] uppercase font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded shadow-md backdrop-blur-sm ${track.tag === 'Original' ? 'bg-green-500/90 text-black' : 'bg-gray-900/80 text-white'}`}>
                                {track.tag || 'Original'}
                            </span>
                        </div>
                        <h3 className="text-sm md:text-base font-semibold truncate">{cleanText(track.title)}</h3>
                        <p className="text-[10px] md:text-sm text-gray-400 truncate">{cleanText(track.artist)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Search;
