import { useEffect, useRef, useState, useCallback } from 'react';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'lofi', label: 'Lofi / Chill' },
    { id: 'dj', label: 'DJ / Edits' },
    { id: 'neon', label: 'Neon / Synth' },
    { id: 'nature', label: 'Nature / Vlogs' }
];

// MASSIVE EXPANDED VAULT: 30+ Verified YouTube Shorts for maximum variety before looping
const YOUTUBE_SHORTS = [
    // Lofi / Chill
    { id: 's1', ytId: "GUuxXsTCaOc", title: "Aesthetic Study Routine", views: "1.2M", category: "lofi" },
    { id: 's2', ytId: "vPLigUWEdfQ", title: "Scenic Route Lofi Beats", views: "2.1M", category: "lofi" },
    { id: 's3', ytId: "mGC11r422yw", title: "Satisfy Your Soul BGM", views: "1.5M", category: "lofi" },
    { id: 's4', ytId: "1VFSKtivPsY", title: "Late Night Study Vlog", views: "3.2M", category: "lofi" },
    { id: 's5', ytId: "Cjbg2DNsrOE", title: "Chill Beatmaking Lofi", views: "850K", category: "lofi" },
    { id: 's6', ytId: "5yx6BWlEVag", title: "Midnight Lofi Study", views: "12M", category: "lofi" },
    { id: 's7', ytId: "7NOSDKb0HlU", title: "Deep Chillstep Mix", views: "900K", category: "lofi" },
    { id: 's8', ytId: "1fueZCTYkpA", title: "Rainy Window Aesthetic", views: "3.4M", category: "lofi" },
    
    // Nature / Vlogs
    { id: 's9', ytId: "wqrj_u_PYiM", title: "Peaceful Nature Vibes", views: "3.4M", category: "nature" },
    { id: 's10', ytId: "MAeDIjnzwt8", title: "Pure Beauty of Nature", views: "5.6M", category: "nature" },
    { id: 's11', ytId: "AHrllyvlZac", title: "Nature Painting Aesthetic", views: "4.1M", category: "nature" },
    { id: 's12', ytId: "4oWzUmPSXYc", title: "Winter Sunset Glow", views: "1.1M", category: "nature" },
    { id: 's13', ytId: "3sZTxkoSciU", title: "Dreamy Landscape", views: "6.7M", category: "nature" },
    { id: 's14', ytId: "vQryFsH_0-Q", title: "Cinematic Forest", views: "2.1M", category: "nature" },
    { id: 's15', ytId: "6v2L2UGZJAM", title: "Ocean Waves Aerial", views: "9.8M", category: "nature" },
    
    // DJ / Bollywood Edits
    { id: 's16', ytId: "cBDyiBOpxug", title: "Bollywood Lofi Mix", views: "920K", category: "dj" },
    { id: 's17', ytId: "VDaPAvuQWpQ", title: "Tum Se Hi Lofi Edit", views: "8.2M", category: "dj" },
    { id: 's18', ytId: "EmHg8YwYvKU", title: "Bol Na Halke Lofi Reverb", views: "2.3M", category: "dj" },
    { id: 's19', ytId: "HyVFL-OdVeQ", title: "Jeene Laga Hoon Flip", views: "4.5M", category: "dj" },
    { id: 's20', ytId: "K4DyBUG242c", title: "NCS Cartoon - On & On", views: "510M", category: "dj" },
    { id: 's21', ytId: "p7ZsBPK656s", title: "Alan Walker - Fade", views: "480M", category: "dj" },
    { id: 's22', ytId: "J2X5mJ3HDYE", title: "Sky High Drops", views: "190M", category: "dj" },
    { id: 's23', ytId: "ALZHF5UqnU4", title: "Festival Drops Mix", views: "22M", category: "dj" },
    
    // Neon / Synth
    { id: 's24', ytId: "1ZYbU82GVz4", title: "Cyberpunk Synthwave", views: "8.5M", category: "neon" },
    { id: 's25', ytId: "hYvVaQ47O1Y", title: "Neon Night City Drive", views: "3.2M", category: "neon" },
    { id: 's26', ytId: "8icpNbgNXRM", title: "Tokyo Drift Aesthetic", views: "1.1M", category: "neon" },
    { id: 's27', ytId: "wY2XkF1v9pI", title: "Retrowave Dashboard", views: "5.6M", category: "neon" },
    { id: 's28', ytId: "6FNHe3kf8_s", title: "Disfigure - Blank", views: "8.5M", category: "neon" },
    { id: 's29', ytId: "bM7SZ5SBzyY", title: "Spectre Drops", views: "3.2M", category: "neon" },
    { id: 's30', ytId: "AOeY-nDp7hI", title: "Different Heaven", views: "1.1M", category: "neon" }
];

const YouTubeCard = ({ video, globalMute, setGlobalMute }) => {
    const iframeRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false); 

    // Sync Master Mute State via YouTube Iframe API
    useEffect(() => {
        if (iframeRef.current && isLoaded) {
            const command = globalMute ? 'mute' : 'unMute';
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: '' }), '*');
        }
    }, [globalMute, isLoaded]);

    // Intersection Observer: Plays video perfectly when in view, pauses when swiped away
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
            
            {/* Smooth Loading Spinner */}
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin opacity-80"></div>
                </div>
            )}

            {/* NATIVE YOUTUBE IFRAME: Cropped perfectly for Vertical TikTok style */}
            <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden flex justify-center items-center bg-black">
                <iframe
                    ref={iframeRef}
                    className="w-[300%] h-[150%] md:w-[120%] md:h-[120%] object-cover pointer-events-none opacity-90 transition-opacity duration-1000"
                    style={{ opacity: isLoaded ? 1 : 0 }}
                    src={`https://www.youtube.com/embed/${video.ytId}?enablejsapi=1&autoplay=0&loop=1&playlist=${video.ytId}&controls=0&mute=1&playsinline=1&modestbranding=1&fs=0`}
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    onLoad={() => setIsLoaded(true)}
                ></iframe>
            </div>

            {/* Tap to Play/Pause Overlay */}
            <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay}></div>

            {!isPlaying && isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none drop-shadow-2xl">
                    <div className="bg-black/60 text-white rounded-full p-4 backdrop-blur-md flex items-center justify-center w-16 h-16 shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-white/10 animate-pulse">
                        <span className="text-2xl ml-1 block text-red-500">▶</span>
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
                <button onClick={(e) => { e.stopPropagation(); setGlobalMute(!globalMute); }} className="flex flex-col items-center gap-1 transition active:scale-90 mb-2">
                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md hover:bg-red-500/80 shadow-lg text-lg border border-white/10 text-white">
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
    const [activeCategory, setActiveCategory] = useState('all');
    const [globalMute, setGlobalMute] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Database Filter Engine
    const getFilteredDatabase = useCallback((category) => {
        if (category === 'all') return YOUTUBE_SHORTS;
        return YOUTUBE_SHORTS.filter(v => v.category === category);
    }, []);

    // Initial Load
    useEffect(() => {
        const db = getFilteredDatabase(activeCategory);
        // Load first 10 videos of the selected category
        setVideos(db.slice(0, 10).map((v, i) => ({ ...v, id: `${v.ytId}-init-${i}` })));
        setSelectedIndex(null);
    }, [activeCategory, getFilteredDatabase]);

    // INFINITE SCROLL ENGINE: Silently generates new unique chunks when you reach the bottom
    const loadMoreVideos = useCallback(() => {
        if (isLoading) return;
        setIsLoading(true);

        setTimeout(() => {
            const db = getFilteredDatabase(activeCategory);
            const currentLen = videos.length;
            const nextBatch = [];

            // Grab the next 8 videos. If we exceed the database length, mathematically loop back to the beginning!
            for (let i = 0; i < 8; i++) {
                const sourceVideo = db[(currentLen + i) % db.length];
                nextBatch.push({
                    ...sourceVideo,
                    // Assign a completely unique React Key to prevent DOM rendering bugs
                    id: `${sourceVideo.ytId}-${Date.now()}-${i}` 
                });
            }

            setVideos(prev => [...prev, ...nextBatch]);
            setIsLoading(false);
        }, 500); // Artificial delay to ensure smooth CSS loading spinner
    }, [activeCategory, videos.length, isLoading, getFilteredDatabase]);

    // AUTO-LOADER OBSERVER: Triggers 'loadMoreVideos' when the last element enters the screen
    const observerRef = useRef();
    const lastElementRef = useCallback(node => {
        if (isLoading) return;
        if (observerRef.current) observerRef.current.disconnect();
        
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                loadMoreVideos();
            }
        }, { threshold: 0.1 });
        
        if (node) observerRef.current.observe(node);
    }, [isLoading, loadMoreVideos]);

    // FULLSCREEN PLAYER VIEW
    if (selectedIndex !== null) {
        const playableQueue = videos.slice(selectedIndex);

        return (
            <div className="fixed inset-0 z-[100] bg-black flex justify-center overflow-hidden">
                <button onClick={() => setSelectedIndex(null)} className="absolute top-4 left-4 z-[110] bg-gray-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 shadow-lg font-bold text-sm hover:bg-red-600 transition active:scale-95">
                    ← Back to Grid
                </button>

                <div className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative smooth-scroll">
                    {playableQueue.map((video, index) => (
                        <div key={video.id} ref={playableQueue.length === index + 1 ? lastElementRef : null} className="w-full h-full snap-start snap-always">
                            <YouTubeCard video={video} globalMute={globalMute} setGlobalMute={setGlobalMute} />
                        </div>
                    ))}
                    
                    {/* Auto-loading visualizer at the bottom of the swipe feed */}
                    {isLoading && (
                        <div className="w-full h-[15vh] snap-start bg-black flex items-center justify-center">
                            <div className="flex items-center gap-2 text-red-500 font-bold">
                                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                Loading infinite feed...
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // GRID SELECTION VIEW
    return (
        <div className="p-4 md:p-8 pb-32">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Discover Status</h1>
            
            {/* Smooth Category Filter Array */}
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-4 mb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {CATEGORIES.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.id)} 
                        className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-bold transition flex-shrink-0 border ${activeCategory === cat.id ? 'bg-green-600 text-white border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5 mt-2">
                {videos.map((video, index) => (
                    <div 
                        key={video.id} 
                        ref={videos.length === index + 1 ? lastElementRef : null} // Attach the infinite auto-loader to the last grid item!
                        onClick={() => setSelectedIndex(index)}
                        className="bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-700 transition active:scale-[0.98] shadow-lg group flex flex-col border border-gray-700/50"
                    >
                        <div className="relative aspect-[3/4] w-full bg-gray-900 flex items-center justify-center overflow-hidden">
                            {/* Natively fetch official High Quality YouTube thumbnail */}
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
                                <span className="flex items-center gap-1 text-green-400 drop-shadow-md">▶ {video.views}</span>
                                <span className="text-gray-500">YT Stream</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Smooth Bottom Loading Failsafe Spinner */}
            {isLoading && (
                <div className="flex justify-center items-center py-10 mt-4">
                    <div className="flex items-center gap-2 text-green-500 font-bold">
                        <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        Generating Feed...
                    </div>
                </div>
            )}
        </div>
    );
};

export default Status;
