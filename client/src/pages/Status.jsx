import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';

const VideoCard = ({ video, isLastVideo, lastVideoElementRef, globalMute, setGlobalMute }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.6 };
        
        const handleIntersection = (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
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
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            videoRef.current?.pause();
            setIsPlaying(false);
        } else {
            videoRef.current?.play();
            setIsPlaying(true);
        }
    };

    // UPGRADED: Tapping mute now updates the Master State, persisting to all future videos
    const toggleMute = (e) => {
        e.stopPropagation(); 
        setGlobalMute(!globalMute);
    };

    return (
        <div ref={isLastVideo ? lastVideoElementRef : null} className="w-full h-full snap-start snap-always relative bg-gray-950 flex items-center justify-center group">
            
            <div className="absolute inset-0 flex items-center justify-center z-0">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin opacity-50"></div>
            </div>

            <video
                ref={videoRef}
                src={video.url}
                className="w-full h-full object-cover relative z-10 cursor-pointer"
                loop
                muted={globalMute}
                playsInline
                crossOrigin="anonymous"
                onClick={togglePlay}
            />

            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none drop-shadow-2xl">
                    <div className="bg-black/60 text-white rounded-full p-4 backdrop-blur-md flex items-center justify-center w-16 h-16 shadow-[0_0_20px_rgba(0,0,0,0.8)] border border-white/10">
                        <span className="text-2xl ml-1">▶</span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-6 left-4 right-16 text-white z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 rounded-xl pointer-events-none">
                <h3 className="font-bold text-lg">{video.author}</h3>
                <p className="text-sm text-gray-300 mt-1">{video.title}</p>
            </div>

            <div className="absolute bottom-6 right-4 flex flex-col items-center gap-5 z-20">
                <button onClick={toggleMute} className="flex flex-col items-center gap-1 transition active:scale-90 mb-2">
                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md hover:bg-green-500/80 shadow-lg text-lg border border-white/10">
                        {globalMute ? '🔇' : '🔊'}
                    </div>
                </button>

                <button className="flex flex-col items-center gap-1 transition active:scale-90">
                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md hover:bg-pink-500/80 shadow-lg text-lg border border-white/10">❤️</div>
                    <span className="text-xs text-white font-semibold shadow-black drop-shadow-md">{video.likes}</span>
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
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // UPGRADED: Master Mute State hoisted to the parent engine
    const [globalMute, setGlobalMute] = useState(true);
    const observerRef = useRef(null);

    const fetchVideos = async (pageNum) => {
        setIsLoading(true);
        try {
            // UPGRADED: Fetching directly from our robust Node.js backend route
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
        } catch (err) {
            setError(err.message);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchVideos(page);
    }, [page]);

    const lastVideoElementRef = useCallback(node => {
        if (isLoading) return;
        if (observerRef.current) observerRef.current.disconnect();
        
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setPage(prevPage => prevPage + 1);
            }
        }, { threshold: 0.5 });
        
        if (node) observerRef.current.observe(node);
    }, [isLoading]);

    return (
        <div className="h-[calc(100vh-130px)] md:h-screen w-full bg-black flex justify-center overflow-hidden">
            <div className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative pb-20 md:pb-0">
                
                {error && videos.length === 0 && (
                    <div className="flex items-center justify-center h-full text-red-400 p-6 text-center bg-gray-900">
                        <p>⚠️ {error}</p>
                    </div>
                )}

                {videos.map((video, index) => (
                    <VideoCard 
                        key={video.id} 
                        video={video} 
                        isLastVideo={videos.length === index + 1} 
                        lastVideoElementRef={lastVideoElementRef} 
                        globalMute={globalMute} 
                        setGlobalMute={setGlobalMute}
                    />
                ))}

                {isLoading && videos.length > 0 && (
                    <div className="w-full h-[15vh] snap-start bg-black flex items-center justify-center text-green-500 text-sm font-bold animate-pulse">
                        Loading high-definition feed...
                    </div>
                )}
            </div>
        </div>
    );
};

export default Status;
