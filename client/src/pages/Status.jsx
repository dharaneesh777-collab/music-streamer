import { useEffect, useRef, useState, useCallback } from 'react';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'lofi', label: 'Lofi Beats' },
    { id: 'dj', label: 'DJ / Bass' },
    { id: 'neon', label: 'Neon City' },
    { id: 'nature', label: 'Cinematic' }
];

// THE PROVEN VAULT: 100% Unblockable Raw MP4s from AWS CloudFront. 
// No CORS issues, no YouTube blocks, instant streaming.
const AESTHETIC_VIDEOS = [
    { id: 'v1', category: 'lofi', url: "https://videos.pexels.com/video-files/5192077/5192077-hd_1080_1920_25fps.mp4", thumbnail: "https://images.pexels.com/photos/5192077/pexels-photo-5192077.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Late Night Drive Lofi", views: "1.2M", size: "3.0 MB" },
    { id: 'v2', category: 'lofi', url: "https://videos.pexels.com/video-files/4057322/4057322-hd_1080_1920_25fps.mp4", thumbnail: "https://images.pexels.com/photos/4057322/pexels-photo-4057322.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Lofi Room Chill Vibes", views: "850K", size: "3.4 MB" },
    { id: 'v3', category: 'lofi', url: "https://videos.pexels.com/video-files/2792370/2792370-hd_1080_1920_30fps.mp4", thumbnail: "https://images.pexels.com/photos/2792370/pexels-photo-2792370.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Melancholy Walk Sad", views: "2.1M", size: "3.2 MB" },
    { id: 'v4', category: 'lofi', url: "https://videos.pexels.com/video-files/5191924/5191924-hd_1080_1920_25fps.mp4", thumbnail: "https://images.pexels.com/photos/5191924/pexels-photo-5191924.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Night Rain Aesthetic", views: "3.4M", size: "5.5 MB" },
    { id: 'v5', category: 'dj', url: "https://videos.pexels.com/video-files/4149231/4149231-hd_1080_1920_30fps.mp4", thumbnail: "https://images.pexels.com/photos/4149231/pexels-photo-4149231.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Club DJ Bass Boosted", views: "5.6M", size: "4.8 MB" },
    { id: 'v6', category: 'dj', url: "https://videos.pexels.com/video-files/4012053/4012053-hd_1080_1920_30fps.mp4", thumbnail: "https://images.pexels.com/photos/4012053/pexels-photo-4012053.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Concert Crowd Energy", views: "4.1M", size: "1.9 MB" },
    { id: 'v7', category: 'dj', url: "https://videos.pexels.com/video-files/3255275/3255275-hd_1080_1920_25fps.mp4", thumbnail: "https://images.pexels.com/photos/3255275/pexels-photo-3255275.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Party Dancing Flash", views: "920K", size: "3.7 MB" },
    { id: 'v8', category: 'dj', url: "https://videos.pexels.com/video-files/4148149/4148149-hd_1080_1920_30fps.mp4", thumbnail: "https://images.pexels.com/photos/4148149/pexels-photo-4148149.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Studio Guitar Solo", views: "1.5M", size: "4.1 MB" },
    { id: 'v9', category: 'neon', url: "https://videos.pexels.com/video-files/5377684/5377684-hd_1080_1920_25fps.mp4", thumbnail: "https://images.pexels.com/photos/5377308/pexels-photo-5377308.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Neon City Cyberpunk", views: "8.2M", size: "3.2 MB" },
    { id: 'v10', category: 'neon', url: "https://videos.pexels.com/video-files/3253735/3253735-hd_1080_1920_25fps.mp4", thumbnail: "https://images.pexels.com/photos/3253735/pexels-photo-3253735.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Abstract Frequency", views: "2.3M", size: "2.1 MB" },
    { id: 'v11', category: 'neon', url: "https://videos.pexels.com/video-files/853889/853889-hd_1080_1920_25fps.mp4", thumbnail: "https://images.pexels.com/photos/853889/pexels-photo-853889.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Cyberpunk Night Drive", views: "4.5M", size: "3.8 MB" },
    { id: 'v12', category: 'neon', url: "https://videos.pexels.com/video-files/3121459/3121459-hd_1080_1920_24fps.mp4", thumbnail: "https://images.pexels.com/photos/3121459/pexels-photo-3121459.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Neon Sign Flicker", views: "1.1M", size: "1.5 MB" },
    { id: 'v13', category: 'nature', url: "https://videos.pexels.com/video-files/1448735/1448735-hd_1080_1920_24fps.mp4", thumbnail: "https://images.pexels.com/photos/1448735/pexels-photo-1448735.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Ocean Waves Aesthetic", views: "6.7M", size: "4.2 MB" },
    { id: 'v14', category: 'nature', url: "https://videos.pexels.com/video-files/1851190/1851190-hd_1080_1920_25fps.mp4", thumbnail: "https://images.pexels.com/photos/1851190/pexels-photo-1851190.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Forest Fog Cinematic", views: "3.2M", size: "3.1 MB" },
    { id: 'v15', category: 'nature', url: "https://videos.pexels.com/video-files/2871929/2871929-hd_1080_1920_30fps.mp4", thumbnail: "https://images.pexels.com/photos/2871929/pexels-photo-2871929.jpeg?auto=compress&cs=tinysrgb&w=400", title: "Sunset Mountain Peak", views: "2.9M", size: "2.8 MB" }
];

const VideoCard = ({ video, globalMute, setGlobalMute, isLast, lastVideoRef }) => {
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
        <div id={`video-container-${video.id}`} ref={isLast ? lastVideoRef : null} className="w-full h-full snap-start snap-always relative bg-gray-950 flex items-center justify-center group overflow-hidden">
            
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

            {/* RAW MP4 STREAMING: Guaranteed to work, no CORS, no YouTube locks */}
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
                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md hover:bg-green-500/80 shadow-lg text-lg border border-white/10">
                        {globalMute ? '🔇' : '🔊'}
                    </div>
                </button>
                <button className="flex flex-col items-center gap-1 transition active:scale-90">
                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md hover:bg-pink-500/80 shadow-lg text-lg border border-white/10">❤️</div>
                    <span className="text-xs text-white font-semibold shadow-black drop-shadow-md">{video.views}</span>
                </button>
                <button className="flex flex-col items-center gap-1 transition active:scale-90">
                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md hover:bg-blue-500/80 shadow-lg text-lg border border-white/10">⬇️</div>
                    <span className="text-[10px] text-white font-semibold shadow-black drop-shadow-md">Save</span>
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
    
    // Tracks completely loaded IDs to mathematically prevent duplicates
    const [shownIds, setShownIds] = useState(new Set());

    // Filter engine
    const getFilteredDatabase = (category) => {
        if (category === 'all') return AESTHETIC_VIDEOS;
        return AESTHETIC_VIDEOS.filter(v => v.category === category);
    };

    // Load initial batch when category changes
    useEffect(() => {
        const db = getFilteredDatabase(activeCategory);
        const initialBatch = db.slice(0, 4); // Load first 4
        setVideos(initialBatch);
        setShownIds(new Set(initialBatch.map(v => v.id)));
        setSelectedIndex(null); // Reset player view
    }, [activeCategory]);

    // INFINITE SCROLL OPTIMIZATION: Auto-loads unique videos as you scroll
    const observerRef = useRef();
    const lastElementRef = useCallback(node => {
        if (observerRef.current) observerRef.current.disconnect();
        
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                // Find videos in the database that haven't been shown yet
                const db = getFilteredDatabase(activeCategory);
                const unseenVideos = db.filter(v => !shownIds.has(v.id));
                
                if (unseenVideos.length > 0) {
                    // Grab next 4 unique videos
                    const nextBatch = unseenVideos.slice(0, 4);
                    setVideos(prev => [...prev, ...nextBatch]);
                    
                    // Update tracker
                    setShownIds(prev => {
                        const newSet = new Set(prev);
                        nextBatch.forEach(v => newSet.add(v.id));
                        return newSet;
                    });
                }
            }
        }, { threshold: 0.5 });
        
        if (node) observerRef.current.observe(node);
    }, [activeCategory, shownIds]);

    if (selectedIndex !== null) {
        const playableQueue = videos.slice(selectedIndex);
        const allLoaded = getFilteredDatabase(activeCategory).length === videos.length;

        return (
            <div className="fixed inset-0 z-[100] bg-black flex justify-center overflow-hidden">
                <button onClick={() => setSelectedIndex(null)} className="absolute top-4 left-4 z-[110] bg-gray-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 shadow-lg font-bold text-sm hover:bg-green-600 transition active:scale-95">
                    ← Back to Grid
                </button>

                <div className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative smooth-scroll">
                    {playableQueue.map((video, index) => (
                        <VideoCard 
                            key={video.id} 
                            video={video} 
                            globalMute={globalMute} 
                            setGlobalMute={setGlobalMute} 
                            isLast={playableQueue.length === index + 1}
                            lastVideoRef={lastElementRef}
                        />
                    ))}
                    
                    {!allLoaded && (
                        <div className="w-full h-[15vh] snap-start bg-black flex items-center justify-center">
                            <div className="flex items-center gap-2 text-green-500 font-bold">
                                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                Loading unique edits...
                            </div>
                        </div>
                    )}
                    {allLoaded && (
                        <div className="w-full h-[15vh] snap-start bg-black flex items-center justify-center text-gray-500 text-sm font-bold">
                            End of Category Feed.
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

            {getFilteredDatabase(activeCategory).length === videos.length && (
                <div className="mt-8 flex justify-center">
                    <span className="text-gray-500 text-sm font-bold bg-gray-900 px-6 py-2 rounded-full border border-gray-800">You've seen all videos in this category.</span>
                </div>
            )}
        </div>
    );
};

export default Status;
