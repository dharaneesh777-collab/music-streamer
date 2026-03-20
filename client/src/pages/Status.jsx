import { useEffect, useRef, useState } from 'react';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'lofi', label: 'Lofi / Aesthetic' },
    { id: 'dj', label: 'DJ / Party' },
    { id: 'neon', label: 'Neon / Synth' },
    { id: 'nature', label: 'Nature / Vlogs' }
];

// THE YOUTUBE VAULT: Curated high-quality, highly embeddable YouTube IDs.
const YOUTUBE_SHORTS = [
    // Lofi / Aesthetic
    { id: 'v1', ytId: "jfKfPfyJRdk", title: "Lofi Girl Aesthetic Beats", views: "4.2M", category: "lofi" },
    { id: 'v2', ytId: "5qap5aO4i9A", title: "Lofi Girl Synthwave", views: "2.1M", category: "lofi" },
    { id: 'v3', ytId: "DWcJFNfaw9c", title: "Chillhop Radio Beats", views: "5.1M", category: "lofi" },
    { id: 'v4', ytId: "5yx6BWlEVag", title: "Chill Lofi Study Mix", views: "1.8M", category: "lofi" },
    
    // DJ / Party
    { id: 'v5', ytId: "K4DyBUG242c", title: "Cartoon - On & On", views: "510M", category: "dj" },
    { id: 'v6', ytId: "p7ZsBPK656s", title: "Alan Walker - Fade (BGM)", views: "480M", category: "dj" },
    { id: 'v7', ytId: "J2X5mJ3HDYE", title: "Elektronomia - Sky High", views: "190M", category: "dj" },
    { id: 'v8', ytId: "jK2aIUmmdP4", title: "Janji - Heroes Tonight", views: "22M", category: "dj" },
    
    // Neon / Synth
    { id: 'v9', ytId: "6FNHe3kf8_s", title: "Disfigure - Blank", views: "8.5M", category: "neon" },
    { id: 'v10', ytId: "bM7SZ5SBzyY", title: "Alan Walker - Spectre", views: "3.2M", category: "neon" },
    { id: 'v11', ytId: "AOeY-nDp7hI", title: "Different Heaven - My Heart", views: "1.1M", category: "neon" },
    { id: 'v12', ytId: "n1ddqXIbpa8", title: "Deaf Kev - Invincible", views: "5.6M", category: "neon" },
    
    // Nature / Cinematic
    { id: 'v13', ytId: "iUZ1zWHJQnY", title: "Costa Rica 4K Cinematic", views: "6.7M", category: "nature" },
    { id: 'v14', ytId: "LXb3EKWsInQ", title: "Wild Wildlife 4K", views: "3.2M", category: "nature" },
    { id: 'v15', ytId: "vQryFsH_0-Q", title: "Cinematic Forest Drops", views: "9.8M", category: "nature" }
];

const YouTubeReel = ({ video, isActive, globalMute, toggleMute }) => {
    const containerRef = useRef(null);
    const playerRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Initialize Official YouTube Iframe API
    useEffect(() => {
        if (!window.YT || !window.YT.Player || playerRef.current) return;

        playerRef.current = new window.YT.Player(containerRef.current, {
            videoId: video.ytId,
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                rel: 0,
                loop: 1,
                playlist: video.ytId, // Required for loop to work
                modestbranding: 1,
                playsinline: 1,
                mute: 1
            },
            events: {
                onReady: (event) => {
                    setIsReady(true);
                    if (globalMute) event.target.mute();
                    else event.target.unMute();
                    
                    if (isActive) {
                        event.target.playVideo();
                        setIsPlaying(true);
                    }
                },
                onError: (event) => {
                    console.error("YouTube Player Error:", event.data);
                    setHasError(true);
                    setIsReady(true); // Stop loading spinner
                },
                onStateChange: (event) => {
                    if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
                    if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
                }
            }
        });

        return () => {
            if (playerRef.current && playerRef.current.destroy) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };
    }, [video.ytId]);

    // Handle Play/Pause based on scroll position (isActive)
    useEffect(() => {
        if (playerRef.current && isReady && !hasError && typeof playerRef.current.playVideo === 'function') {
            if (isActive) {
                playerRef.current.playVideo();
            } else {
                playerRef.current.pauseVideo();
                setIsPlaying(false);
            }
        }
    }, [isActive, isReady, hasError]);

    // Handle Global Mute
    useEffect(() => {
        if (playerRef.current && isReady && !hasError && typeof playerRef.current.mute === 'function') {
            if (globalMute) playerRef.current.mute();
            else playerRef.current.unMute();
        }
    }, [globalMute, isReady, hasError]);

    const handleScreenClick = () => {
        if (hasError || !playerRef.current || !isReady) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    };

    return (
        <div className="w-full h-full snap-start snap-always relative bg-gray-950 flex items-center justify-center overflow-hidden">
            
            {!isReady && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin opacity-80"></div>
                </div>
            )}

            {hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-900 text-gray-500">
                    <span className="text-4xl mb-2">🚫</span>
                    <p className="text-sm font-semibold">Creator Restricted Embedding</p>
                </div>
            )}

            <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden flex justify-center items-center bg-black">
                {/* Using a wrapper to crop the 16:9 YouTube video into a TikTok style vertical frame. 
                    pointer-events-none ensures our custom click handler works cleanly.
                */}
                <div 
                    ref={containerRef} 
                    className={`w-[350%] h-[150%] md:w-[120%] md:h-[120%] object-cover pointer-events-none transition-opacity duration-700 ${hasError ? 'opacity-0' : 'opacity-90'}`}
                ></div>
            </div>

            {/* Click overlay */}
            <div className="absolute inset-0 z-10 cursor-pointer" onClick={handleScreenClick}></div>

            {!isPlaying && isReady && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none drop-shadow-2xl">
                    <div className="bg-black/60 text-white rounded-full p-4 backdrop-blur-md flex items-center justify-center w-16 h-16 shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-white/10 animate-pulse">
                        <span className="text-2xl ml-1 text-red-500">▶</span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-6 left-4 right-16 text-white z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 rounded-xl pointer-events-none">
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider mb-2 inline-block shadow-md">
                    {video.category}
                </span>
                <p className="font-bold text-lg drop-shadow-lg leading-tight">{video.title}</p>
            </div>

            <div className="absolute bottom-6 right-4 flex flex-col items-center gap-5 z-20">
                <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="flex flex-col items-center gap-1 transition active:scale-90 mb-2">
                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md shadow-lg text-lg border border-white/10 text-white">
                        {globalMute ? '🔇' : '🔊'}
                    </div>
                </button>
                <button className="flex flex-col items-center gap-1 transition active:scale-90">
                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md shadow-lg text-lg border border-white/10">❤️</div>
                    <span className="text-xs text-white font-semibold shadow-black drop-shadow-md">{video.views}</span>
                </button>
            </div>
        </div>
    );
};

const Status = () => {
    const [ytApiLoaded, setYtApiLoaded] = useState(false);
    const [videos, setVideos] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [globalMute, setGlobalMute] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [activeFeedIndex, setActiveFeedIndex] = useState(0);

    // Global Initialization of YouTube API
    useEffect(() => {
        if (window.YT && window.YT.Player) {
            setYtApiLoaded(true);
            return;
        }

        window.onYouTubeIframeAPIReady = () => {
            setYtApiLoaded(true);
        };

        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }, []);

    useEffect(() => {
        if (activeCategory === 'all') setVideos(YOUTUBE_SHORTS);
        else setVideos(YOUTUBE_SHORTS.filter(v => v.category === activeCategory));
        setSelectedIndex(null);
    }, [activeCategory]);

    // Precise Math-based Scroll Tracker for Autoplay
    const handleScroll = (e) => {
        const container = e.target;
        const scrollPosition = container.scrollTop;
        const windowHeight = container.clientHeight;
        const currentIndex = Math.round(scrollPosition / windowHeight);
        
        if (currentIndex !== activeFeedIndex) {
            setActiveFeedIndex(currentIndex);
        }
    };

    const toggleGlobalMute = () => setGlobalMute(!globalMute);

    if (selectedIndex !== null) {
        const playableQueue = videos.slice(selectedIndex);

        return (
            <div className="fixed inset-0 z-[100] bg-black flex justify-center overflow-hidden">
                <button onClick={() => setSelectedIndex(null)} className="absolute top-4 left-4 z-[110] bg-gray-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 shadow-lg font-bold text-sm hover:bg-red-600 transition active:scale-95">
                    ← Back to Grid
                </button>

                {!ytApiLoaded ? (
                    <div className="flex w-full h-full items-center justify-center text-red-500 font-bold">
                        Initializing YouTube Engine...
                    </div>
                ) : (
                    <div 
                        onScroll={handleScroll}
                        className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative smooth-scroll"
                    >
                        {playableQueue.map((video, index) => (
                            <YouTubeReel 
                                key={video.id} 
                                video={video} 
                                isActive={index === activeFeedIndex} 
                                globalMute={globalMute} 
                                toggleMute={toggleGlobalMute} 
                            />
                        ))}
                        
                        <div className="w-full h-[25vh] snap-start bg-black flex flex-col items-center justify-center text-gray-500 text-sm font-bold gap-3">
                            <span>End of Feed. ✅</span>
                            <button onClick={() => setSelectedIndex(null)} className="bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition">
                                Browse Categories
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 pb-32">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Discover Status</h1>
            
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 mb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {CATEGORIES.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.id)} 
                        className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-bold transition flex-shrink-0 border ${activeCategory === cat.id ? 'bg-red-600 text-white border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5 mt-2">
                {videos.map((video, index) => (
                    <div 
                        key={video.id} 
                        onClick={() => {
                            setSelectedIndex(index);
                            setActiveFeedIndex(0); // Reset scroll index tracker
                        }}
                        className="bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-700 transition active:scale-[0.98] shadow-lg group flex flex-col border border-gray-700/50"
                    >
                        <div className="relative aspect-[3/4] w-full bg-gray-900 flex items-center justify-center overflow-hidden">
                            <img src={`https://i.ytimg.com/vi/${video.ytId}/hqdefault.jpg`} alt={video.title} className="w-[150%] h-[150%] object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                            
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-red-600 text-white rounded-full p-3 shadow-[0_0_15px_rgba(220,38,38,0.8)] scale-90 group-hover:scale-100 transition-transform">
                                    <span className="text-xl ml-1 block">▶</span>
                                </div>
                            </div>
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-[9px] font-bold px-1.5 py-0.5 rounded text-gray-300 uppercase shadow">
                                {video.category}
                            </div>
                        </div>
                        
                        <div className="p-3 flex-1 flex flex-col justify-between bg-gradient-to-b from-gray-800 to-gray-900">
                            <h3 className="text-xs md:text-sm font-bold text-white line-clamp-2 mb-2 leading-snug">{video.title}</h3>
                            <div className="flex justify-between items-center text-[10px] md:text-xs text-gray-400 font-semibold">
                                <span className="flex items-center gap-1 text-red-400 drop-shadow-md">▶ {video.views}</span>
                                <span className="text-gray-500">Official API</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Status;
