import { useState, useEffect, useContext } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { API_BASE_URL } from '../config';

const cleanText = (str) => str ? str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'") : '';

const Playlists = () => {
    const [selectedCategory, setSelectedCategory] = useState('My Playlist');
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false); 
    const { playTrack } = useContext(PlayerContext); // UPGRADED

    // ADDED: Anime Hits mapping
    const artistMap = { 'AR Rahman Hits': 'ar_rahman', 'Anirudh Hits': 'anirudh', 'Ilaiyaraaja Hits': 'ilaiyaraaja', 'Yuvan Hits': 'yuvan', 'Harris Jayaraj Hits': 'harris_jayaraj', 'Anime Hits': 'anime' };

    useEffect(() => {
        if (selectedCategory === 'My Playlist') {
            setTracks(JSON.parse(localStorage.getItem('my_playlist')) || []);
        } else {
            setLoading(true);
            fetch(`${API_BASE_URL}/api/artist-playlist/${artistMap[selectedCategory]}`)
                .then(res => res.json())
                .then(data => { if (data.success) setTracks(data.data); setLoading(false); })
                .catch(() => setLoading(false));
        }
    }, [selectedCategory]);

    const handleRemove = (e, trackId) => {
        e.stopPropagation();
        if (selectedCategory === 'My Playlist') {
            const updated = tracks.filter(t => t.id !== trackId);
            setTracks(updated);
            localStorage.setItem('my_playlist', JSON.stringify(updated));
        }
    };

    const downloadAllAudio = () => { /* Same as before */ };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl md:text-3xl font-bold">{selectedCategory}</h1>
            </div>

            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 scrollbar-hide mb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                {['My Playlist', ...Object.keys(artistMap)].map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full whitespace-nowrap text-xs md:text-sm font-semibold transition shadow-md ${selectedCategory === cat ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{cat}</button>
                ))}
            </div>

            {loading ? <p className="text-sm text-gray-400 animate-pulse">Fetching curated full-length hits...</p> : (
                tracks.length === 0 ? <p className="text-sm text-gray-400">This playlist is currently empty.</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                        {tracks.map((track, index) => (
                            // UPGRADED: Now passes the ENTIRE 'tracks' array into context so the engine knows what to play next
                            <div key={track.id + index} className="flex items-center justify-between bg-gray-800/80 p-2 md:p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition group active:scale-[0.98]" onClick={() => playTrack(track, tracks)}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <img src={track.cover} alt="cover" className="h-10 w-10 md:h-12 md:w-12 rounded object-cover flex-shrink-0 shadow-md" />
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm md:text-base font-semibold truncate">{cleanText(track.title)}</h3>
                                        </div>
                                        <p className="text-xs text-gray-400 truncate">{cleanText(track.artist)}</p>
                                    </div>
                                </div>
                                {selectedCategory === 'My Playlist' && (
                                    <button onClick={(e) => handleRemove(e, track.id)} className="text-gray-500 hover:text-red-500 opacity-100 md:opacity-0 group-hover:opacity-100 transition px-3">✖</button>
                                )}
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default Playlists;
