import { useState, useEffect, useContext } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { API_BASE_URL } from '../config';

const Playlists = () => {
    const [selectedCategory, setSelectedCategory] = useState('My Playlist');
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false); 
    const { setCurrentTrack } = useContext(PlayerContext);

    const artistMap = {
        'AR Rahman Hits': 'ar_rahman',
        'Anirudh Hits': 'anirudh',
        'Ilaiyaraaja Hits': 'ilaiyaraaja',
        'Yuvan Hits': 'yuvan',
        'Harris Jayaraj Hits': 'harris_jayaraj'
    };

    useEffect(() => {
        if (selectedCategory === 'My Playlist') {
            setTracks(JSON.parse(localStorage.getItem('my_playlist')) || []);
        } else {
            setLoading(true);
            const artistId = artistMap[selectedCategory];
            fetch(`${API_BASE_URL}/api/artist-playlist/${artistId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setTracks(data.data);
                    setLoading(false);
                })
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

    const downloadAllAudio = () => {
        if (tracks.length === 0) return;
        alert(`Starting download of ${tracks.length} tracks. Please click "Allow" if your browser asks for permission.`);
        setIsDownloading(true);
        
        tracks.forEach((track, index) => {
            setTimeout(() => {
                if(track.audioUrl) {
                    const downloadUrl = `${API_BASE_URL}/api/download?url=${encodeURIComponent(track.audioUrl)}&title=${encodeURIComponent(track.title)}`;
                    const link = document.createElement("a");
                    link.href = downloadUrl;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                if (index === tracks.length - 1) {
                    setTimeout(() => setIsDownloading(false), 2000);
                }
            }, index * 1500); 
        });
    };

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">{selectedCategory}</h1>
                
                {tracks.length > 0 && !loading && (
                    <button 
                        onClick={downloadAllAudio}
                        disabled={isDownloading}
                        className={`px-4 py-2 rounded font-semibold transition shadow-lg ${isDownloading ? 'bg-green-800 cursor-not-allowed text-gray-300' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                    >
                        {isDownloading ? 'Downloading...' : '⬇️ Download All'}
                    </button>
                )}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-6">
                {['My Playlist', ...Object.keys(artistMap)].map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition ${selectedCategory === cat ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{cat}</button>
                ))}
            </div>

            {loading ? <p className="text-gray-400">Fetching curated full-length hits from backend...</p> : (
                tracks.length === 0 ? (
                    <p className="text-gray-400">This playlist is currently empty.</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {tracks.map((track, index) => (
                            <div key={track.id + index} className="flex items-center justify-between bg-gray-800 p-3 rounded hover:bg-gray-700 cursor-pointer transition group" onClick={() => setCurrentTrack(track)}>
                                <div className="flex items-center gap-4">
                                    <img src={track.cover} alt="cover" className="h-12 w-12 rounded" />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{track.title}</h3>
                                            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${track.tag === 'Original' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-300'}`}>
                                                {track.tag || 'Original'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400">{track.artist}</p>
                                    </div>
                                </div>
                                
                                {selectedCategory === 'My Playlist' && (
                                    <button onClick={(e) => handleRemove(e, track.id)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition mr-4" title="Remove">✖</button>
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
