import { useState, useContext, useEffect } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { API_BASE_URL } from '../config';

const cleanText = (str) => str ? str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'") : '';
const LANGUAGES = ['All', 'English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Japanese'];

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [albums, setAlbums] = useState([]); 
    const [activeAlbumName, setActiveAlbumName] = useState(null); 
    const [activeLang, setActiveLang] = useState(localStorage.getItem('preferred_lang') || 'All');
    const [loading, setLoading] = useState(false);
    const { playTrack } = useContext(PlayerContext);

    useEffect(() => {
        localStorage.setItem('preferred_lang', activeLang);
        const delayDebounceFn = setTimeout(() => {
            if (query.trim()) {
                setLoading(true); setActiveAlbumName(null); 
                
                // UPGRADED: Pass language securely via URL parameters instead of hacking the search text
                fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&lang=${activeLang}&type=albums`)
                    .then(res => res.json())
                    .then(data => setAlbums(data.success && Array.isArray(data.data) ? data.data : []));

                fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&lang=${activeLang}`)
                    .then(res => res.json())
                    .then(data => { setResults(data.success ? data.data : []); setLoading(false); });
            } else { setResults([]); setAlbums([]); setActiveAlbumName(null); }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [query, activeLang]);

    const handleAlbumClick = (album) => {
        setLoading(true);
        fetch(`${API_BASE_URL}/api/search?id=${album.id}&type=albumDetails`)
            .then(res => res.json())
            .then(data => { if (data.success) { setResults(data.data); setActiveAlbumName(album.title); } setLoading(false); });
    };

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Search</h1>
            
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 mb-4 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {LANGUAGES.map(lang => (
                    <button key={lang} onClick={() => setActiveLang(lang)} className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition flex-shrink-0 border ${activeLang === lang ? 'bg-green-600 text-white border-green-500' : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>{lang}</button>
                ))}
            </div>

            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search songs, movies, or anime..." className="w-full max-w-md bg-gray-800 text-white rounded-full py-2.5 px-5 mb-6 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-inner" />
            
            {loading && <p className="text-sm text-gray-400 mb-4 animate-pulse">Searching...</p>}
            
            {albums.length > 0 && !activeAlbumName && !loading && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold mb-4 text-green-400">Official Movies & Albums</h2>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                        {albums.map(album => (
                            <div key={album.id} onClick={() => handleAlbumClick(album)} className="w-[100px] md:w-[140px] flex-none bg-green-900/20 border border-green-800 p-2 rounded-lg cursor-pointer hover:bg-green-800/40 transition active:scale-95 shadow-lg">
                                <img src={album.cover} alt="cover" className="w-full aspect-square object-cover rounded mb-2" />
                                <h3 className="text-[10px] md:text-xs font-bold truncate">{cleanText(album.title)}</h3>
                            </div>
                        ))}
                    </div>
                    <hr className="border-gray-800 mt-2" />
                </div>
            )}

            {(results.length > 0 || activeAlbumName) && (
                <div>
                    <h2 className="text-lg font-bold mb-4">{activeAlbumName ? <span className="text-white">Official Tracks: <span className="text-green-400">{cleanText(activeAlbumName)}</span></span> : 'Songs'}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pb-20">
                        {results.map(track => (
                            <div key={track.id} className="bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition active:scale-[0.98]" onClick={() => playTrack(track, results)}>
                                <div className="relative mb-3"><img src={track.cover} alt="cover" className="w-full aspect-square object-cover rounded shadow-lg" /></div>
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
