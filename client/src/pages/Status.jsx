import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';

const VideoCard = ({ video, globalMute, setGlobalMute }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false); 
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (videoRef.current) videoRef.current.muted = globalMute;
    }, [globalMute]);

    useEffect(() => {
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.6 };
        const handleIntersection = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasError) {
                    videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                } else {
                    videoRef.current?.pause();
                    setIsPlaying(false);
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersection, observerOptions);
        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, [hasError]);

    const togglePlay = () => {
        if (hasError) return;
        if (isPlaying) {
            videoRef.current?.pause();
            setIsPlaying(false);
        } else {
            videoRef.current?.play();
            setIsPlaying(true);
        }
    };

    return (
        <div id={`video-container-${video.id}`} className="w-full h-full snap-start snap-always relative bg-gray-950 flex items-center justify-center group">
            
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin opacity-80"></div>
                </div>
            )}

            {hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-900 text-gray-500">
                    <span className="text-4xl mb-2">⚠️</span>
                    <p className="text-sm font-semibold">Video Stream Unavailable</p>
                </div>
            )}

            {/* CRITICAL ARCHITECTURE FIX: 
                1. Removed the /api/stream wrapper. Video streams directly from CDN. 
                2. Added referrerPolicy="no-referrer" to mathematically bypass CDN hotlink blocks.
            */}
            <video
                ref={videoRef}
                src={video.url}
                className={`w-full h-full object-cover relative z-10 cursor-pointer ${hasError ? 'hidden' : 'block'}`}
                loop
                muted={globalMute}
                playsInline
                referrerPolicy="no-referrer"
                onClick={togglePlay}
                onLoadedData={() => setIsLoaded(true)} 
                onError={() => { setIsLoaded(true); setHasError(true); }}
            />

            {!isPlaying && isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none drop-shadow-2xl">
                    <div className="bg-black/60 text-white rounded-full p-4 backdrop-blur-md flex items-center justify-center w-16 h-16 shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-white/10">
                        <span className="text-2xl ml-1">▶</span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-6 left-4 right-16 text-white z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 rounded-xl pointer-events-none">
                <p className="font-bold text-lg drop-shadow-lg">{video.title}</p>
            </div>

            <div className="absolute bottom-6 right-4 flex flex-col items-center gap-5 z-20">
                <button onClick={(e) => { e.stopPropagation(); setGlobalMute(!globalMute); }} className="flex flex-col items-center gap-1 transition active:scale-90 mb-2">
                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md hover:bg-green-500/80 shadow-lg text-lg border border-white/10">
                        {globalMute ? '🔇' : '🔊'}
                    </div>
                </button>
                <button className="flex flex-col items-center gap-1 transition active:scale-90">
                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md hover:bg-pink-500/80 shadow-lg text-lg border border-white/10">❤️</div>
                    <span className="text-xs text-white font-semibold shadow-black drop-shadow-md">{video.views}</span>
                </button>
            </div>
        </div>
    );
};

const Status = () => {
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [globalMute, setGlobalMute] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(null);

    const fetchVideos = async (pageNum) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/status?page=${pageNum}`);
            if (!response.ok) throw new Error("Backend connection failed");
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
                setVideos(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newVids = data.data.filter(v => !existingIds.has(v.id));
                    return [...prev, ...newVids];
                });
            }
        } catch (err) { setError(err.message); }
        setIsLoading(false);
    };

    useEffect(() => { fetchVideos(page); }, [page]);

    // UI VIEW 1: Immersive Player
    if (selectedIndex !== null) {
        const playableQueue = videos.slice(selectedIndex);

        return (
            <div className="fixed inset-0 z-[100] bg-black flex justify-center overflow-hidden">
                <button onClick={() => setSelectedIndex(null)} className="absolute top-4 left-4 z-[110] bg-gray-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 shadow-lg font-bold text-sm hover:bg-gray-800 transition active:scale-95">
                    ← Back to Grid
                </button>

                <div className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative">
                    {playableQueue.map((video) => (
                        <VideoCard key={video.id} video={video} globalMute={globalMute} setGlobalMute={setGlobalMute} />
                    ))}
                    <div className="w-full h-[15vh] snap-start bg-black flex items-center justify-center text-gray-600 text-sm font-bold">
                        End of current queue. Go back to browse more.
                    </div>
                </div>
            </div>
        );
    }

    // UI VIEW 2: Selection Grid
    return (
        <div className="p-4 md:p-8 pb-32">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Status Video Downloads</h1>
            
            {error && videos.length === 0 && (
                <div className="text-red-400 p-4 bg-red-900/20 rounded-md mb-6 border border-red-800">
                    ⚠️ {error}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
                {videos.map((video, index) => (
                    <div 
                        key={video.id} 
                        onClick={() => setSelectedIndex(index)}
                        className="bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-700 transition active:scale-95 shadow-lg group flex flex-col"
                    >
                        <div className="relative aspect-[3/4] w-full">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition duration-300" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-green-500 text-white rounded-full p-3 shadow-[0_0_15px_rgba(34,197,94,0.6)]">
                                    <span className="text-xl ml-1 block">▶</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-3 flex-1 flex flex-col justify-between">
                            <h3 className="text-xs md:text-sm font-bold text-white line-clamp-2 mb-2 leading-tight">{video.title}</h3>
                            <div className="flex justify-between items-center text-[10px] md:text-xs text-gray-400 font-semibold">
                                <span className="flex items-center gap-1">👁️ {video.views}</span>
                                <span>{video.size}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 flex justify-center">
                <button 
                    onClick={() => setPage(p => p + 1)}
                    disabled={isLoading}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 px-6 rounded-full border border-gray-700 transition active:scale-95 disabled:opacity-50"
                >
                    {isLoading ? 'Loading...' : 'Load More Videos'}
                </button>
            </div>
        </div>
    );
};

export default Status;
