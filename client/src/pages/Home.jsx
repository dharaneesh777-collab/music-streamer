import { useEffect, useState, useContext } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { API_BASE_URL } from '../config';

const cleanText = (str) => str ? str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, ') : '';
const Home = () => {
    const [trending, setTrending] = useState([]);
    const [error, setError] = useState(null);
    const { playTrack } = useContext(PlayerContext);

    useEffect(() => {
        fetch(`${API_BASE_URL}/api/trending`)
            .then(res => res.json())
            .then(data => {
                if (data && data.success && data.data) {
                    setTrending(data.data);
                } else {
                    setTrending([]);
                    setError("Failed to load tracks. The API proxy might be temporarily rate-limited.");
                }
            })
            .catch(err => {
                console.error(err);
                setTrending([]);
                setError("Network error connecting to the local backend.");
            });
    }, []);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Trending Now</h1>
            {error && <div className="text-red-400 mb-6 bg-red-900/20 p-4 rounded border border-red-900">{error}</div>}
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {trending.map(track => (
                    <div 
                        key={track.id} 
                        className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition"
                        onClick={() => playTrack(track, trending)}
                    >
                        <div className="relative mb-4">
                            <img src={track.cover} alt={cleanText(track.title)} className="w-full aspect-square object-cover rounded shadow-lg" />
                            <span className={`absolute top-2 right-2 text-[10px] uppercase font-bold px-2 py-1 rounded shadow-md backdrop-blur-sm ${track.tag === 'Original' ? 'bg-green-500/90 text-black' : 'bg-gray-900/80 text-white'}`}>
                                {track.tag || 'Original'}
                            </span>
                        </div>
                        <h3 className="font-semibold truncate">{cleanText(track.title)}</h3>
                        <p className="text-sm text-gray-400 truncate">{cleanText(track.artist)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
