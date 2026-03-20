import { useEffect, useRef, useState } from 'react';

// THE BULLETPROOF VAULT: Official YouTube IDs. 
// These are globally hosted by Google and mathematically impossible to block via CORS.
const YOUTUBE_SHORTS = [
    { id: 'y1', ytId: "jfKfPfyJRdk", title: "Lofi Girl Aesthetic Beats", views: "4.2M", size: "YT Stream" },
    { id: 'y2', ytId: "K4DyBUG242c", title: "NCS Cartoon - On & On", views: "510M", size: "YT Stream" },
    { id: 'y3', ytId: "p7ZsBPK656s", title: "Alan Walker - Fade (BGM)", views: "480M", size: "YT Stream" },
    { id: 'y4', ytId: "J2X5mJ3HDYE", title: "Elektronomia - Sky High", views: "190M", size: "YT Stream" },
    { id: 'y5', ytId: "5yx6BWlEVag", title: "Chill Lofi Study Mix", views: "12M", size: "YT Stream" },
    { id: 'y6', ytId: "1ZYbU82GVz4", title: "Cyberpunk Synthwave Drive", views: "8.5M", size: "YT Stream" },
    { id: 'y7', ytId: "hYvVaQ47O1Y", title: "Neon Night City Drive", views: "3.2M", size: "YT Stream" },
    { id: 'y8', ytId: "lTRiuFIWV54", title: "Aesthetic Rain Window", views: "5.1M", size: "YT Stream" },
    { id: 'y9', ytId: "7NOSDKb0HlU", title: "Chillstep Deep Mix", views: "900K", size: "YT Stream" },
    { id: 'y10', ytId: "9FvvbVI5rYA", title: "Anime Aesthetic Vibes", views: "1.8M", size: "YT Stream" }
];

const YouTubeCard = ({ video, globalMute, setGlobalMute }) => {
    const iframeRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false); 

    // Synchronize global mute state using YouTube's postMessage API
    useEffect(() => {
        if (iframeRef.current && isLoaded) {
            const command = globalMute ? 'mute' : 'unMute';
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: '' }), '*');
        }
    }, [globalMute, isLoaded]);

    // Intersection Observer to Auto-Play/Pause
    useEffect(() => {
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.6 };
        const handleIntersection = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && iframeRef.current) {
                    iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: '' }), '*');
                    setIsPlaying(true);
                } else if (iframeRef.current) {
                    iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }), '*');
                    setIsPlaying(false);
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersection, observerOptions);
        const container = document.getElementById(`yt-container-${video.id}`);
        if (container) observer.observe(container);
        return () => observer.disconnect();
    }, [video.id]);

    const togglePlay = () => {
        const command = isPlaying ? 'pauseVideo' : 'playVideo';
        setIsPlaying(!isPlaying);
        if (iframeRef.current) {
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: '' }), '*');
        }
    };

    return (
        <div id={`yt-container-${video.id}`} className="w-full h-full snap-start snap-always relative bg-gray-950 flex items-center justify-center overflow-hidden">
            
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin opacity-80"></div>
                </div>
            )}

            {/* CRITICAL ARCHITECTURE: The YouTube Native Engine
                w-[300%] h-[300%] mathematically forces a standard 16:9 YouTube video to zoom in and crop 
                perfectly into a vertical TikTok-style full-screen aesthetic!
            */}
            <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden flex justify-center items-center">
                <iframe
                    ref={iframeRef}
                    className="w-[350%] h-[150%] md:w-[150%] md:h-[150%] object-cover pointer-events-none"
                    src={`https://www.youtube-nocookie.com/embed/${video.ytId}?enablejsapi=1&autoplay=0&loop=1&playlist=${video.ytId}&controls=0&mute=1&playsinline=1&modestbranding=1&fs=0`}
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    onLoad={() => setIsLoaded(true)}
                ></iframe>
            </div>

            {/* Invisible Overlay to capture swipe/click interactions without YouTube stealing them */}
            <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay}></div>

            {!isPlaying && isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none drop-shadow-2xl">
                    <div className="bg-black/60 text-white rounded-full p-4 backdrop-blur-md flex items-center justify-center w-16 h-16 shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-white/10">
                        <span className="text-2xl ml-1 block text-red-500">▶</span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-6 left-4 right-16 text-white z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 rounded-xl pointer-events-none">
                <p className="font-bold text-lg drop-shadow-lg">{video.title}</p>
            </div>

            <div className="absolute bottom-6 right-4 flex flex-col items-center gap-5 z-20">
                <button onClick={() => setGlobalMute(!globalMute)} className="flex flex-col items-center gap-1 transition active:scale-90 mb-2">
                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md hover:bg-red-500/80 shadow-lg text-lg border border-white/10">
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
    const [globalMute, setGlobalMute] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(null);

    useEffect(() => {
        setVideos(YOUTUBE_SHORTS);
    }, []);

    const loadMoreVideos = () => {
        const nextBatch = YOUTUBE_SHORTS.map((v, index) => ({
            ...v,
            id: `v-${Date.now()}-${index}`
        }));
        setVideos(prev => [...prev, ...nextBatch]);
    };

    if (selectedIndex !== null) {
        const playableQueue = videos.slice(selectedIndex);

        return (
            <div className="fixed inset-0 z-[100] bg-black flex justify-center overflow-hidden">
                <button onClick={() => setSelectedIndex(null)} className="absolute top-4 left-4 z-[110] bg-gray-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 shadow-lg font-bold text-sm hover:bg-red-600 transition active:scale-95">
                    ← Back to Grid
                </button>

                <div className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative">
                    {playableQueue.map((video) => (
                        <YouTubeCard key={video.id} video={video} globalMute={globalMute} setGlobalMute={setGlobalMute} />
                    ))}
                    <div className="w-full h-[15vh] snap-start bg-black flex items-center justify-center">
                        <button onClick={loadMoreVideos} className="text-red-500 font-bold border border-red-500 px-6 py-2 rounded-full hover:bg-red-900/30 transition">
                            Load More YouTube Shorts ↓
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 pb-32">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Trending Status Downloads</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
                {videos.map((video, index) => (
                    <div 
                        key={video.id} 
                        onClick={() => setSelectedIndex(index)}
                        className="bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-700 transition active:scale-95 shadow-lg group flex flex-col"
                    >
                        <div className="relative aspect-[3/4] w-full bg-black flex items-center justify-center overflow-hidden">
                            {/* Dynamically fetches the official High-Quality YouTube Thumbnail */}
                            <img src={`https://img.youtube.com/vi/${video.ytId}/hqdefault.jpg`} alt={video.title} className="w-[150%] h-[150%] object-cover opacity-90 group-hover:opacity-100 transition duration-300" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-red-600 text-white rounded-full p-3 shadow-[0_0_15px_rgba(220,38,38,0.6)]">
                                    <span className="text-xl ml-1 block">▶</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-3 flex-1 flex flex-col justify-between">
                            <h3 className="text-xs md:text-sm font-bold text-white line-clamp-2 mb-2 leading-tight">{video.title}</h3>
                            <div className="flex justify-between items-center text-[10px] md:text-xs text-gray-400 font-semibold">
                                <span className="flex items-center gap-1 text-red-400">▶ {video.views}</span>
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
                    Load More YouTube Status
                </button>
            </div>
        </div>
    );
};

export default Status;
