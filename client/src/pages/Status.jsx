import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';

const CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'lofi', label: 'Lofi Beats' },
    { id: 'dj', label: 'DJ / Bass' },
    { id: 'neon', label: 'Neon City' },
    { id: 'nature', label: 'Cinematic' }
];

const YouTubeCard = ({ video, globalMute, setGlobalMute, isLast, lastVideoRef }) => {
    const iframeRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false); 

    useEffect(() => {
        if (iframeRef.current && isLoaded) {
            const command = globalMute ? 'mute' : 'unMute';
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: '' }), '*');
        }
    }, [globalMute, isLoaded]);

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
        const container = document.getElementById(`yt-container-${video.ytId}`);
        if (container) observer.observe(container);
        return () => observer.disconnect();
    }, [video.ytId]);

    const togglePlay = () => {
        const command = isPlaying ? 'pauseVideo' : 'playVideo';
        setIsPlaying(!isPlaying);
        if (iframeRef.current) {
            iframeRef.current.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: '' }), '*');
        }
    };

    return (
        <div id={`yt-container-${video.ytId}`} ref={isLast ? lastVideoRef : null} className="w-full h-full snap-start snap-always relative bg-gray-950 flex items-center justify-center overflow-hidden">
            
            {/* Smooth Fade-in Loader */}
            <div className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}>
                <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden flex justify-center items-center bg-black">
                <iframe
                    ref={iframeRef}
                    className="w-[350%] h-[150%] md:w-[150%] md:h-[150%] object-cover pointer-events-none opacity-90 transition-opacity duration-700 ease-in-out"
                    style={{ opacity: isLoaded ? 1 : 0 }}
                    src={`https://www.youtube-nocookie.com/embed/${video.ytId}?enablejsapi=1&autoplay=0&loop=1&playlist=${video.ytId}&controls=0&mute=1&playsinline=1&modestbranding=1&fs=0`}
                    frameBorder="0"
                    allow="autoplay; encrypted-media"
                    onLoad={() => setIsLoaded(true)}
                ></iframe>
            </div>

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
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [globalMute, setGlobalMute] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(null);

    // AUTO-LOADING OBSERVER: Silently fetches new videos when you reach the bottom
    const observerRef = useRef();
    const lastElementRef = useCallback(node => {
        if (isLoading) return;
        if (observerRef.current) observerRef.current.disconnect();
        
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchVideos(nextPage, activeCategory);
            }
        }, { threshold: 0.5 });
        
        if (node) observerRef.current.observe(node);
    }, [isLoading, hasMore, page, activeCategory]);

    const fetchVideos = async (pageNum, category) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/status?page=${pageNum}&category=${category}`);
            const data = await res.json();
            
            if (data.success) {
                setVideos(prev => {
                    const existingIds = new Set(prev.map(p => p.ytId));
                    const newVids = data.data.filter(v => !existingIds.has(v.ytId));
                    return pageNum === 1 ? data.data : [...prev, ...newVids];
                });
                setHasMore(data.hasMore);
            }
        } catch (err) { console.error("Fetch failed", err); }
        setIsLoading(false);
    };

    useEffect(() => {
        setPage(1);
        setVideos([]); 
        fetchVideos(1, activeCategory);
    }, [activeCategory]);

    // UI VIEW 1: Immersive Seamless Player
    if (selectedIndex !== null) {
        const playableQueue = videos.slice(selectedIndex);

        return (
            <div className="fixed inset-0 z-[100] bg-black flex justify-center overflow-hidden">
                <button onClick={() => setSelectedIndex(null)} className="absolute top-4 left-4 z-[110] bg-gray-900/80 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 shadow-lg font-bold text-sm hover:bg-red-600 transition active:scale-95">
                    ← Back to Grid
                </button>

                <div className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative smooth-scroll">
                    {playableQueue.map((video, index) => (
                        <YouTubeCard 
                            key={video.ytId} 
                            video={video} 
                            globalMute={globalMute} 
                            setGlobalMute={setGlobalMute} 
                            isLast={playableQueue.length === index + 1}
                            lastVideoRef={lastElementRef}
                        />
                    ))}
                    
                    {isLoading && (
                        <div className="w-full h-[15vh] snap-start bg-black flex items-center justify-center">
                            <div className="flex items-center gap-2 text-red-500 font-bold">
                                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                Loading more...
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // UI VIEW 2: Smooth Selection Grid
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
                        key={video.ytId} 
                        ref={videos.length === index + 1 ? lastElementRef : null} // Auto-load in grid view too!
                        onClick={() => setSelectedIndex(index)}
                        className="bg-gray-800 rounded-xl overflow-hidden cursor-pointer hover:bg-gray-700 transition active:scale-[0.98] shadow-lg group flex flex-col border border-gray-700/50"
                    >
                        <div className="relative aspect-[3/4] w-full bg-gray-900 flex items-center justify-center overflow-hidden">
                            <img src={`https://img.youtube.com/vi/${video.ytId}/hqdefault.jpg`} alt={video.title} className="w-[150%] h-[150%] object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" loading="lazy" />
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
                                <span className="text-gray-500">YT Stream</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isLoading && (
                <div className="flex justify-center items-center py-10">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
        </div>
    );
};

export default Status;
