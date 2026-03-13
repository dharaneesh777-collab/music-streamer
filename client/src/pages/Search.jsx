import { useState, useContext, useEffect } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { API_BASE_URL } from '../config';

const cleanText = (str) => str ? str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'") : '';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [albums, setAlbums] = useState([]); 
    const [activeAlbumName, setActiveAlbumName] = useState(null); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { playTrack } = useContext(PlayerContext);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.trim()) {
                setLoading(true);
                setError(null);
                setActiveAlbumName(null); 
                
                fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&type=albums`)
                    .then(res => res.json())
                    .then(data => setAlbums(data.success && Array.isArray(data.data) ? data.data : []))
                    .catch(() => setAlbums([]));

                fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`)
                    .then(res => res.json())
                    .then(data => {
                        setResults(data.success && Array.isArray(data.data) ? data.data : []);
                        setLoading(false);
                    })
                    .catch(() => { setError("Network error."); setLoading(false); });
            } else {
                setResults([]); setAlbums([]); setError(null); setActiveAlbumName(null);
            }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleAlbumClick = (album) => {
        setLoading(true);
        fetch(`${API_BASE_URL}/api/search?id=${album.id}&type=albumDetails`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.length > 0) {
                    setResults(data.data); 
                    setActiveAlbumName(album.title);
                } else {
                    alert("This official soundtrack is not currently streamable.");
                }
                setLoading(false);
            });
    };

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
            
            {albums.length > 0 && !activeAlbumName && !loading && (
                <div className="mb-8">
                    <h2 className="text-lg md:text-xl font-bold mb-4 text-green-400">Official Movies & Albums</h2>
                    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {albums.map(album => (
                            // STRICT DIMENSION LOCK: w-[100px] md:w-[140px] flex-none
                            <div key={album.id} onClick={() => handleAlbumClick(album)} className="w-[100px] md:w-[140px] flex-none bg-green-900/20 border border-green-800 p-2 md:p-3 rounded-lg cursor-pointer hover:bg-green-800/40 transition active:scale-95 shadow-lg">
                                <img src={album.cover} alt="cover" className="w-full aspect-square object-cover rounded shadow-md mb-2" />
                                <h3 className="text-[10px] md:text-xs font-bold truncate leading-tight">{cleanText(album.title)}</h3>
                                <p className="text-[8px] md:text-[9px] text-green-500 truncate mt-1 uppercase tracking-wider font-semibold">Official Album</p>
                            </div>
                        ))}
                    </div>
                    <hr className="border-gray-800 mt-2" />
                </div>
            )}

            {(results.length > 0 || activeAlbumName) && (
                <div>
                    <h2 className="text-lg md:text-xl font-bold mb-4">
                        {activeAlbumName ? <span className="text-white">Official Tracks: <span className="text-green-400">{cleanText(activeAlbumName)}</span></span> : 'Individual Songs'}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6 pb-20">
                        {results.map(track => (
                            <div 
                                key={track.id} 
                                className="bg-gray-800 p-3 md:p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition active:scale-[0.98]"
                                onClick={() => playTrack(track, results)}
                            >
                                <div className="relative mb-3 md:mb-4">
                                    <img src={track.cover} alt="cover" className="w-full aspect-square object-cover rounded shadow-lg" />
                                </div>
                                <h3 className="text-[11px] md:text-sm font-semibold truncate">{cleanText(track.title)}</h3>
                                <p className="text-[9px] md:text-xs text-gray-400 truncate">{cleanText(track.artist)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;
