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

        // NEW FEATURE: Recently Played Tab
        if (selectedCategory === 'Recently Played') {
            setTracks(JSON.parse(localStorage.getItem('listening_history')) || []);
            return;
        }
        
        setLoading(true);
        if (selectedCategory === 'Recommended') {
            const history = JSON.parse(localStorage.getItem('listening_history')) || [];
            if (history.length === 0) { setTracks([]); setLoading(false); return; }
            
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
                const uniqueRecs = Array.from(new Map(recs.map(item => [item.id, item])).values());
                setTracks(uniqueRecs.sort(() => 0.5 - Math.random()).slice(0, 24));
                setLoading(false);
            };
            fetchRecs();
            return;
        }

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

    const handleDownloadTrack = (e, track) => {
        e.stopPropagation();
        const downloadUrl = `${API_BASE_URL}/api/download?url=${encodeURIComponent(track.audioUrl)}&title=${encodeURIComponent(track.title)}`;
        window.open(downloadUrl, '_blank');
    };

    // UPGRADED FIX: Stealth <a> tags bypass the Chrome popup blocker, limit raised to 15
    const handleBatchDownload = () => {
        const MAX_DOWNLOADS = 15;
        if (tracks.length === 0) return;
        
        if (tracks.length > MAX_DOWNLOADS) {
            alert(`⛔ ERROR: Limit Exceeded.\n\nOnly ${MAX_DOWNLOADS} songs can be batch-downloaded at a time.\nYou have ${tracks.length} songs selected.\n\nPlease clear some songs or download individually.`);
            return;
        }
        
        if (window.confirm(`Ready to securely download ${tracks.length} MP3 files?\n\n(Note: Keep this tab open. Downloads will begin sequentially).`)) {
            tracks.forEach((track, index) => {
                setTimeout(() => {
                    const downloadUrl = `${API_BASE_URL}/api/download?url=${encodeURIComponent(track.audioUrl)}&title=${encodeURIComponent(track.title)}`;
                    
                    // Invisible DOM injection to mimic human clicks
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }, index * 1200); // Staggered by 1.2 seconds for server stability
            });
        }
    };

    const clearPlaylist = () => {
        if(window.confirm("Are you sure you want to delete all songs from My Playlist?")) {
            localStorage.removeItem('my_playlist');
            setTracks([]);
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl md:text-3xl font-bold">{selectedCategory === 'Recommended' ? 'Made For You' : selectedCategory}</h1>
                
                {selectedCategory === 'My Playlist' && tracks.length > 0 && (
                    <div className="flex gap-2">
                        <button onClick={handleBatchDownload} className="bg-green-900/40 text-green-500 border border-green-800 hover:bg-green-600 hover:text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 transition active:scale-95 shadow-lg">
                            <span>⬇️</span> <span className="hidden md:inline font-bold">Download All (Max 15)</span>
                        </button>
                        <button onClick={clearPlaylist} className="bg-red-900/40 text-red-500 border border-red-800 hover:bg-red-600 hover:text-white text-xs md:text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 transition active:scale-95 shadow-lg">
                            <span>🗑️</span> <span className="hidden md:inline font-bold">Clear</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {['Recommended', 'Recently Played', 'My Playlist', ...Object.keys(artistMap)].map(cat => (
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
                                    <button onClick={(e) => handleDownloadTrack(e, track)} className="absolute bottom-1 right-1 bg-black/70 hover:bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow backdrop-blur-md transition text-xs border border-gray-600/50" title="Download Song">⬇️</button>
                                    {selectedCategory === 'My Playlist' && (
                                        <button onClick={(e) => handleRemove(e, track.id)} className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:scale-110 transition border border-red-400">✖</button>
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
