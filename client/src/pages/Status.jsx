import { useEffect, useRef, useState, useCallback } from 'react';

// IMPORTANT: For a production app, move this key to your .env file. 
// You can get your own free key at https://www.pexels.com/api/
const PEXELS_API_KEY = "YOUR_PEXELS_API_KEY"; // Replace with your actual key if you get one
const FALLBACK_KEY = "563492ad6f917000010000018f27660a4fde4686940c3132e080eb21"; // Temporary demo key

const Status = () => {
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [error, setError] = useState(null);
    
    const videoRefs = useRef([]);
    const observerRef = useRef(null); // Watches for infinite scroll

    // FETCH ENGINE: Retrieves vertical videos from Pexels
    const fetchVideos = async (pageNum) => {
        setIsLoading(true);
        try {
            // We search for "cinematic", "neon", or "abstract" vertical videos
            const query = "cinematic music abstract";
            const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=medium&per_page=5&page=${pageNum}`, {
                headers: { Authorization: FALLBACK_KEY }
            });
            
            if (!response.ok) throw new Error("API Limit Reached or Network Error");
            
            const data = await response.json();
            
            // Format API data into our Streamer UI structure
            const formattedVideos = data.videos.map(v => {
                // Find the best .mp4 file (usually the SD or HD version, avoiding massive 4K files for mobile)
                const videoFile = v.video_files.find(file => file.file_type === 'video/mp4' && file.width >= 400) || v.video_files[0];
                return {
                    id: v.id,
                    url: videoFile.link,
                    title: `Visualizer ${v.id}`,
                    author: `@${v.user.name.replace(/\s+/g, '').toLowerCase()}`,
                    likes: `${Math.floor(Math.random() * 90 + 10)}.${Math.floor(Math.random() * 9)}K` // Simulated engagement
                };
            }).filter(v => v.url); // Ensure URL exists

            setVideos(prev => {
                // Prevent duplicates if React StrictMode fires twice
                const existingIds = new Set(prev.map(p => p.id));
                const newVids = formattedVideos.filter(v => !existingIds.has(v.id));
                return [...prev, ...newVids];
            });
            
        } catch (err) {
            setError(err.message);
        }
        setIsLoading(false);
    };

    // Initial Load & Pagination Trigger
    useEffect(() => {
        fetchVideos(page);
    }, [page]);

    // INFINITE SCROLL OBSERVER: Triggers next page fetch when hitting the bottom
    const lastVideoElementRef = useCallback(node => {
        if (isLoading) return;
        if (observerRef.current) observerRef.current.disconnect();
        
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setPage(prevPage => prevPage + 1); // Trigger next page fetch
            }
        }, { threshold: 0.5 });
        
        if (node) observerRef.current.observe(node);
    }, [isLoading]);

    // AUTOPLAY OBSERVER: Plays visible video, pauses hidden ones
    useEffect(() => {
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.6 };

        const handleIntersection = (entries) => {
            entries.forEach((entry) => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    video.play().catch(e => console.log("Autoplay blocked until user interacts"));
                } else {
                    video.pause();
                }
            });
        };

        const playObserver = new IntersectionObserver(handleIntersection, observerOptions);

        videoRefs.current.forEach((video) => {
            if (video) playObserver.observe(video);
        });

        return () => {
            videoRefs.current.forEach((video) => {
                if (video) playObserver.unobserve(video);
            });
        };
    }, [videos]); // Re-bind observer when new videos load

    return (
        <div className="h-[calc(100vh-130px)] md:h-screen w-full bg-black flex justify-center overflow-hidden">
            <div className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative pb-20 md:pb-0">
                
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-md text-white p-3 rounded-full border border-white/20 transition active:scale-95 shadow-lg"
                >
                    {isMuted ? '🔇 Muted' : '🔊 Unmuted'}
                </button>

                {error && videos.length === 0 && (
                    <div className="flex items-center justify-center h-full text-red-400 p-6 text-center bg-gray-900">
                        <p>⚠️ Failed to load video feed. {error}</p>
                    </div>
                )}

                {videos.map((video, index) => {
                    const isLastVideo = videos.length === index + 1;
                    
                    return (
                        <div 
                            key={`${video.id}-${index}`} 
                            ref={isLastVideo ? lastVideoElementRef : null} // Attach infinite scroll trigger to the last element
                            className="w-full h-full snap-start snap-always relative bg-gray-950 flex items-center justify-center"
                        >
                            {/* Loading Skeleton underneath the video */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin opacity-50"></div>
                            </div>

                            <video
                                ref={(el) => (videoRefs.current[index] = el)}
                                src={video.url}
                                className="w-full h-full object-cover relative z-10"
                                loop
                                muted={isMuted}
                                playsInline
                                crossOrigin="anonymous"
                            />

                            <div className="absolute bottom-6 left-4 right-16 text-white z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 rounded-xl pointer-events-none">
                                <h3 className="font-bold text-lg">{video.author}</h3>
                                <p className="text-sm text-gray-300 mt-1">{video.title}</p>
                            </div>

                            <div className="absolute bottom-6 right-4 flex flex-col items-center gap-6 z-20">
                                <button className="flex flex-col items-center gap-1 group transition active:scale-90">
                                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md group-hover:bg-green-500/80 shadow-lg">❤️</div>
                                    <span className="text-xs text-white font-semibold shadow-black drop-shadow-md">{video.likes}</span>
                                </button>
                                <button className="flex flex-col items-center gap-1 group transition active:scale-90">
                                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md group-hover:bg-blue-500/80 shadow-lg">💬</div>
                                    <span className="text-xs text-white font-semibold shadow-black drop-shadow-md">Share</span>
                                </button>
                            </div>
                        </div>
                    );
                })}

                {isLoading && videos.length > 0 && (
                    <div className="w-full h-[15vh] snap-start bg-black flex items-center justify-center text-gray-500 text-sm">
                        Loading more content...
                    </div>
                )}
            </div>
        </div>
    );
};

export default Status;
