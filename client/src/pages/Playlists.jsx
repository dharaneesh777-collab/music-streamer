import { useState, useEffect, useContext } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { API_BASE_URL } from '../config';

const cleanText = (str) => str ? str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'") : '';

const Playlists = () => {
    const [selectedCategory, setSelectedCategory] = useState('Recommended');
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(false);
    const { playTrack } = useContext(PlayerContext);

    const artistMap = { 'AR Rahman Hits': 'ar_rahman', 'Anirudh Hits': 'anirudh', 'Ilaiyaraaja Hits': 'ilaiyaraaja', 'Yuvan Hits': 'yuvan', 'Harris Jayaraj Hits': 'harris_jayaraj', 'Anime Hits': 'anime' };

    useEffect(() => {
        if (selectedCategory === 'My Playlist') {
            setTracks(JSON.parse(localStorage.getItem('my_playlist')) || []);
            return;
        }
        
        setLoading(true);
        if (selectedCategory === 'Recommended') {
            const history = JSON.parse(localStorage.getItem('listening_history')) || [];
            if (history.length === 0) { setTracks([]); setLoading(false); return; }
            
            // Generate Algorithm: Fetch hits from top 2 recently played artists
            const recentArtists = [...new Set(history.map(t => cleanText(t.artist).split(',')[0]))].slice(0, 2);
            let recs = [];
            
            const fetchRecs = async () => {
                for(let artist of recentArtists) {
                    try {
                        const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(artist + " hits")}&limit=15`);
                        const data = await res.json();
                        if(data.success) recs = [...recs, ...data.data];
                    } catch(e) {}
                }
                // Shuffle recommendations and deduplicate
                const uniqueRecs = Array.from(new Map(recs.map(item => [item.id, item])).values());
                setTracks(uniqueRecs.sort(() => 0.5 - Math.random()).slice(0, 24));
                setLoading(false);
            };
            fetchRecs();
            return;
        }

        // Standard curated playlists
        fetch(`${API_BASE_URL}/api/artist-playlist/${artistMap[selectedCategory]}`)
            .then(res => res.json())
            .then(data => { if (data.success) setTracks(data.data); setLoading(false); })
            .catch(() => setLoading(false));

    }, [selectedCategory]);

    const handleRemove = (e, trackId) => {
        e.stopPropagation();
        if (selectedCategory === 'My Playlist') {
            const updated = tracks.filter(t => t.id !== trackId);
            setTracks(updated);
            localStorage.setItem('my_playlist', JSON.stringify(updated));
        }
    };

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">{selectedCategory === 'Recommended' ? 'Made For You' : selectedCategory}</h1>

            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {['Recommended', 'My Playlist', ...Object.keys(artistMap)].map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-semibold transition shadow-md flex-shrink-0 border ${selectedCategory === cat ? 'bg-white text-black border-white' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>{cat === 'Recommended' ? '✨ Recommended' : cat}</button>
                ))}
            </div>

            {loading ? <p className="text-sm text-gray-400 animate-pulse">Analyzing listening habits & fetching tracks...</p> : (
                tracks.length === 0 ? <p className="text-sm text-gray-400">{selectedCategory === 'Recommended' ? 'Play some songs first to get personalized recommendations!' : 'This playlist is empty.'}</p> : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6 pb-20">
                        {tracks.map((track, index) => (
                            <div key={track.id + index} className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition active:scale-[0.98]" onClick={() => playTrack(track, tracks)}>
                                <div className="relative mb-3">
                                    <img src={track.cover} alt="cover" className="w-full aspect-square object-cover rounded shadow-md" />
                                    {selectedCategory === 'My Playlist' && (
                                        <button onClick={(e) => handleRemove(e, track.id)} className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full w-6 h-6 flex items-center justify-center shadow">✖</button>
                                    )}
                                </div>
                                <h3 className="text-[11px] md:text-sm font-semibold truncate">{cleanText(track.title)}</h3>
                                <p className="text-[9px] md:text-xs text-gray-400 truncate">{cleanText(track.artist)}</p>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};
export default Playlists;
