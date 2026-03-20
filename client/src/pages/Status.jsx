import { useEffect, useRef, useState } from 'react';

// THE SERVERLESS VAULT: Raw AWS CloudFront Links (Zero CORS Blocks, Zero Backend Dependency)
const AESTHETIC_VIDEOS = [
    { 
        id: 'v1', 
        url: "https://videos.pexels.com/video-files/5377684/5377684-hd_1080_1920_25fps.mp4", 
        thumbnail: "https://images.pexels.com/photos/5377308/pexels-photo-5377308.jpeg?auto=compress&cs=tinysrgb&w=400", 
        title: "Neon City Cyberpunk Status", views: "124K", size: "3.2 MB" 
    },
    { 
        id: 'v2', 
        url: "https://videos.pexels.com/video-files/4149231/4149231-hd_1080_1920_30fps.mp4", 
        thumbnail: "https://images.pexels.com/photos/4149231/pexels-photo-4149231.jpeg?auto=compress&cs=tinysrgb&w=400", 
        title: "Club DJ Bass Boosted", views: "504K", size: "4.8 MB" 
    },
    { 
        id: 'v3', 
        url: "https://videos.pexels.com/video-files/5192077/5192077-hd_1080_1920_25fps.mp4", 
        thumbnail: "https://images.pexels.com/photos/5192077/pexels-photo-5192077.jpeg?auto=compress&cs=tinysrgb&w=400", 
        title: "Late Night Drive Lofi", views: "92K", size: "3.0 MB" 
    },
    { 
        id: 'v4', 
        url: "https://videos.pexels.com/video-files/4012053/4012053-hd_1080_1920_30fps.mp4", 
        thumbnail: "https://images.pexels.com/photos/4012053/pexels-photo-4012053.jpeg?auto=compress&cs=tinysrgb&w=400", 
        title: "Concert Crowd Energy", views: "45K", size: "1.9 MB" 
    },
    { 
        id: 'v5', 
        url: "https://videos.pexels.com/video-files/5191924/5191924-hd_1080_1920_25fps.mp4", 
        thumbnail: "https://images.pexels.com/photos/5191924/pexels-photo-5191924.jpeg?auto=compress&cs=tinysrgb&w=400", 
        title: "Night Rain Aesthetic", views: "330K", size: "5.5 MB" 
    },
    { 
        id: 'v6', 
        url: "https://videos.pexels.com/video-files/3253735/3253735-hd_1080_1920_25fps.mp4", 
        thumbnail: "https://images.pexels.com/photos/3253735/pexels-photo-3253735.jpeg?auto=compress&cs=tinysrgb&w=400", 
        title: "Abstract Frequency Visuals", views: "76K", size: "2.1 MB" 
    },
    { 
        id: 'v7', 
        url: "https://videos.pexels.com/video-files/4057322/4057322-hd_1080_1920_25fps.mp4", 
        thumbnail: "https://images.pexels.com/photos/4057322/pexels-photo-4057322.jpeg?auto=compress&cs=tinysrgb&w=400", 
        title: "Lofi Room Chill Vibes", views: "201K", size: "3.4 MB" 
    },
    { 
        id: 'v8', 
        url: "https://videos.pexels.com/video-files/4148149/4148149-hd_1080_1920_30fps.mp4", 
        thumbnail: "https://images.pexels.com/photos/4148149/pexels-photo-4148149.jpeg?auto=compress&cs=tinysrgb&w=400", 
        title: "Studio Guitar Solo", views: "210K", size: "4.1 MB" 
    },
    { 
        id: 'v9', 
        url: "https://videos.pexels.com/video-files/3255275/3255275-hd_1080_1920_25fps.mp4", 
        thumbnail: "https://images.pexels.com/photos/3255275/pexels-photo-3255275.jpeg?auto=compress&cs=tinysrgb&w=400", 
        title: "Party Dancing Flash", views: "112K", size: "3.7 MB" 
    },
    { 
        id: 'v10', 
        url: "https://videos.pexels.com/video-files/2792370/2792370-hd_1080_1920_30fps.mp4", 
        thumbnail: "https://images.pexels.com/photos/2792370/pexels-photo-2792370.jpeg?auto=compress&cs=tinysrgb&w=400", 
        title: "Melancholy Walk Sad Status", views: "124K", size: "3.2 MB" 
    }
];

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

            {/* CRITICAL FIX: Pure HTML5 Native Streaming directly from the CDN */}
            <video
                ref={videoRef}
                src={video.url}
                className={`w-full h-full object-cover relative z-10 cursor-pointer ${hasError ? 'hidden' : 'block'}`}
                loop
                muted={globalMute}
                playsInline
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
                <button className="flex flex-col items-center gap-1 transition active:scale-90">
                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md hover:bg-blue-500/80 shadow-lg text-lg border border-white/10">💬</div>
                    <span className="text-xs text-white font-semibold shadow-black drop-shadow-md">Share</span>
                </button>
            </div>
        </div>
    );
};

const Status = () => {
    const [videos, setVideos] = useState([]);
    const [globalMute, setGlobalMute] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(null);

    // SERVERLESS ARCHITECTURE: Instantly loads the grid from the local array
    useEffect(() => {
        setVideos(AESTHETIC_VIDEOS);
    }, []);

    // INFINITE SCROLL: Appends the same array to itself to create an endless loop of videos
    const loadMoreVideos = () => {
        const nextBatch = AESTHETIC_VIDEOS.map((v, index) => ({
            ...v,
            id: `v-${Date.now()}-${index}`
        }));
        setVideos(prev => [...prev, ...nextBatch]);
    };

    // UI VIEW 1: Immersive Player View
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
                    <div className="w-full h-[15vh] snap-start bg-black flex items-center justify-center">
                        <button onClick={loadMoreVideos} className="text-green-500 font-bold border border-green-500 px-6 py-2 rounded-full hover:bg-green-900/30 transition">
                            Load More Videos ↓
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // UI VIEW 2: KKOnline Style Selection Grid
    return (
        <div className="p-4 md:p-8 pb-32">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Status Video Downloads</h1>

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
                    onClick={loadMoreVideos}
                    className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 px-6 rounded-full border border-gray-700 transition active:scale-95"
                >
                    Load More Status Videos
                </button>
            </div>
        </div>
    );
};

export default Status;
