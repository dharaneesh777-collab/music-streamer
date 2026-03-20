import { useEffect, useRef, useState, useCallback } from 'react';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'lofi', label: 'Lofi / Aesthetic' },
    { id: 'dj', label: 'DJ / Party' },
    { id: 'neon', label: 'Neon / Synth' },
    { id: 'nature', label: 'Nature / Vlogs' }
];

// THE MASTER VAULT: 100% Direct MP4 URLs. No YouTube iframes. No gray screens.
const DIRECT_MP4_DATABASE = [
    // Lofi / Aesthetic
    { id: 'v1', category: 'lofi', url: "https://cdn.coverr.co/videos/coverr-a-beautiful-girl-listening-to-music-4089/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400", title: "Lost in the Music", views: "1.2M", size: "3.1 MB" },
    { id: 'v2', category: 'lofi', url: "https://cdn.coverr.co/videos/coverr-driving-through-the-city-at-night-4228/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=400", title: "Late Night Drive Lofi", views: "850K", size: "2.8 MB" },
    { id: 'v3', category: 'lofi', url: "https://cdn.coverr.co/videos/coverr-playing-the-piano-in-a-studio-5244/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400", title: "Studio Piano Melancholy", views: "2.1M", size: "3.7 MB" },
    { id: 'v4', category: 'lofi', url: "https://res.cloudinary.com/demo/video/upload/w_720,h_1280,c_fill/v1604050165/dog.mp4", thumbnail: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400", title: "Morning Vibes Lofi", views: "330K", size: "4.5 MB" },
    
    // DJ / Party
    { id: 'v5', category: 'dj', url: "https://cdn.coverr.co/videos/coverr-dj-mixing-music-at-a-party-5264/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=400", title: "Club DJ Bass Boosted", views: "5.6M", size: "4.8 MB" },
    { id: 'v6', category: 'dj', url: "https://cdn.coverr.co/videos/coverr-crowd-at-a-music-festival-5269/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400", title: "Festival Crowd Energy", views: "4.1M", size: "5.5 MB" },
    { id: 'v7', category: 'dj', url: "https://cdn.coverr.co/videos/coverr-dj-playing-music-5265/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400", title: "Rave DJ Studio Set", views: "920K", size: "3.7 MB" },
    { id: 'v8', category: 'dj', url: "https://cdn.coverr.co/videos/coverr-people-dancing-at-a-party-5267/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400", title: "Party Dancing Flash", views: "1.5M", size: "3.4 MB" },
    
    // Neon / Synth
    { id: 'v9', category: 'neon', url: "https://cdn.coverr.co/videos/coverr-neon-lights-in-the-city-4390/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=400", title: "Neon City Cyberpunk", views: "8.2M", size: "3.2 MB" },
    { id: 'v10', category: 'neon', url: "https://cdn.coverr.co/videos/coverr-a-woman-with-neon-lights-4395/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=400", title: "Neon Portraits", views: "2.3M", size: "2.1 MB" },
    { id: 'v11', category: 'neon', url: "https://cdn.coverr.co/videos/coverr-playing-electric-guitar-5249/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400", title: "Electric Guitar Solo", views: "4.5M", size: "2.8 MB" },
    { id: 'v12', category: 'neon', url: "https://res.cloudinary.com/demo/video/upload/w_720,h_1280,c_fill/v1604051080/skate.mp4", thumbnail: "https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=400", title: "Urban Skate Aesthetic", views: "1.1M", size: "3.5 MB" },
    
    // Nature / Vlogs
    { id: 'v13', category: 'nature', url: "https://res.cloudinary.com/demo/video/upload/w_720,h_1280,c_fill/v1604049877/marmots.mp4", thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400", title: "Nature Wilderness BGM", views: "6.7M", size: "4.2 MB" },
    { id: 'v14', category: 'nature', url: "https://res.cloudinary.com/demo/video/upload/w_720,h_1280,c_fill/v1604050220/elephants.mp4", thumbnail: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=400", title: "Safari Cinematic Drops", views: "3.2M", size: "3.1 MB" },
    { id: 'v15', category: 'nature', url: "https://res.cloudinary.com/demo/video/upload/w_720,h_1280,c_fill/v1604050857/snowboarding.mp4", thumbnail: "https://images.unsplash.com/photo-1551524559-8af4e6624178?w=400", title: "Snowboard Extreme Status", views: "2.9M", size: "4.8 MB" }
];

const NativeVideoCard = ({ video, globalMute, setGlobalMute, isLast, lastVideoRef }) => {
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
                if (entry.isIntersecting && !hasError && videoRef.current) {
                    videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                } else if (videoRef.current) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersection, observerOptions);
        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, [hasError]);

    const togglePlay = () => {
        if (hasError || !videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    return (
        <div id={`vid-container-${video.id}`} ref={isLast ? lastVideoRef : null} className="w-full h-full snap-start snap-always relative bg-gray-950 flex items-center justify-center group overflow-hidden">
            
            {/* Smooth Loading Spinner */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin opacity-80"></div>
                </div>
            )}

            {hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-900 text-gray-500">
                    <span className="text-4xl mb-2">⚠️</span>
                    <p className="text-sm font-semibold">Video Unavailable</p>
                </div>
            )}

            {/* RAW NATIVE MP4 STREAMING: No gray screens, perfectly smooth swiping */}
            <video
                ref={videoRef}
                src={video.url}
                className={`w-full h-full object-cover relative z-10 cursor-pointer transition-opacity duration-700 ease-in-out ${hasError ? 'hidden' : 'block'}`}
                style={{ opacity: isLoaded ? 1 : 0 }}
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
                    <div className="bg-black/60 text-white rounded-full p-4 backdrop-blur-md flex items-center justify-center w-16 h-16 shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-white/10 animate-pulse">
                        <span className="text-2xl ml-1">▶</span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-6 left-4 right-16 text-white z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 rounded-xl pointer-events-none">
                <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider mb-2 inline-block shadow-md">
                    {video.category}
                </span>
                <p className="font-bold text-lg drop-shadow-lg leading-tight">{video.title}</p>
            </div>

            <div className="absolute bottom-6 right-4 flex flex-col items-center gap-5 z-20">
                <button onClick={(e) => { e.stopPropagation(); setGlobalMute(!globalMute); }} className="flex flex-col items-center gap-1 transition active:scale-90 mb-2">
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
    const [videos, setVideos] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [globalMute, setGlobalMute] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(null);
    
    // Pagination & Auto-Load State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const ITEMS_PER_PAGE = 4;

    const getFilteredDatabase = useCallback((category) => {
        if (category === 'all') return DIRECT_MP4_DATABASE;
        return DIRECT_MP4_DATABASE.filter(v => v.category === category);
    }, []);

    // Initial Load on Category Change
    useEffect(() => {
        const db = getFilteredDatabase(activeCategory);
        setVideos(db.slice(0, ITEMS_PER_PAGE));
        setPage(1);
        setHasMore(db.length > ITEMS_PER_PAGE);
        setSelectedIndex(null);
    }, [activeCategory, getFilteredDatabase]);

    // INFINITE SCROLL OPTIMIZATION: Fetches mathematically unique batches. NO REPEATS.
    const loadMoreVideos = useCallback(() => {
        if (isLoading || !hasMore) return;
        setIsLoading(true);

        setTimeout(() => {
            const db = getFilteredDatabase(activeCategory);
            const startIndex = page * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const nextBatch = db.slice(startIndex, endIndex);

            if (nextBatch.length > 0) {
                setVideos(prev => [...prev, ...nextBatch]);
                setPage(prev => prev + 1);
            }
            
            // If we hit the end of the database, STOP. Do not loop.
            if (endIndex >= db.length) {
                setHasMore(false);
            }
            
            setIsLoading(false);
        }, 500); 
    }, [activeCategory, hasMore, isLoading, page, getFilteredDatabase]);

    // AUTO-LOADER OBSERVER
    const observerRef = useRef();
    const lastElementRef = useCallback(node => {
        if (isLoading || !hasMore) return;
        if (observerRef.current) observerRef.current.disconnect();
        
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                loadMoreVideos();
            }
        }, { threshold: 0.1 });
        
        if (node) observerRef.current.observe(node);
    }, [isLoading, hasMore, loadMoreVideos]);

    if (selectedIndex !== null) {
        const playableQueue = videos.slice(selectedIndex);

        return (
            <div className="fixed inset-0 z-[100] bg-black flex justify-center overflow-hidden">
                <button onClick={() => setSelectedIndex(null)} className="absolute top-4 left-4 z-[110] bg-gray-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 shadow-lg font-bold text-sm hover:bg-green-600 transition active:scale-95">
                    ← Back to Grid
                </button>

                <div className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative smooth-scroll">
                    {playableQueue.map((video, index) => (
                        <NativeVideoCard 
                            key={video.id} 
                            video={video} 
                            globalMute={globalMute} 
                            setGlobalMute={setGlobalMute} 
                            isLast={playableQueue.length === index + 1}
                            lastVideoRef={lastElementRef}
                        />
                    ))}
                    
                    {isLoading && hasMore && (
                        <div className="w-full h-[15vh] snap-start bg-black flex items-center justify-center">
                            <div className="flex items-center gap-2 text-green-500 font-bold">
                                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                Loading unique feed...
                            </div>
                        </div>
                    )}

                    {/* GUARANTEED NO REPEATS: Explicitly tells the user the content is finished */}
                    {!hasMore && (
                        <div className="w-full h-[25vh] snap-start bg-black flex flex-col items-center justify-center text-gray-500 text-sm font-bold gap-3">
                            <span>You've caught up! ✅</span>
                            <button onClick={() => setSelectedIndex(null)} className="bg-gray-800 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition">
                                Browse other categories
                            </button>
                        </div>
                    )}
                </div>
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
                        ref={videos.length === index + 1 ? lastElementRef : null} 
                        onClick={() => setSelectedIndex(index)}
                        className="bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-700 transition active:scale-[0.98] shadow-lg group flex flex-col border border-gray-700/50"
                    >
                        <div className="relative aspect-[3/4] w-full bg-gray-900 flex items-center justify-center overflow-hidden">
                            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                            
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-green-600 text-white rounded-full p-3 shadow-[0_0_15px_rgba(34,197,94,0.8)] scale-90 group-hover:scale-100 transition-transform">
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
                                <span className="text-gray-500">{video.size}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isLoading && hasMore && (
                <div className="flex justify-center items-center py-10 mt-4">
                    <div className="flex items-center gap-2 text-green-500 font-bold">
                        <div className="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        Generating Feed...
                    </div>
                </div>
            )}

            {!hasMore && (
                <div className="mt-8 flex justify-center">
                    <span className="text-gray-500 text-sm font-bold bg-gray-900 px-6 py-2 rounded-full border border-gray-800">You've seen all videos in this category. ✅</span>
                </div>
            )}
        </div>
    );
};

export default Status;
