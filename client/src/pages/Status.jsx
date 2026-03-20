import { useEffect, useRef, useState, useCallback } from 'react';

const PEXELS_API_KEY = "YOUR_PEXELS_API_KEY"; 
const FALLBACK_KEY = "563492ad6f917000010000018f27660a4fde4686940c3132e080eb21"; 

// THE SECURE VAULT: 10 High-Quality Open-Source Videos for infinite looping
const FALLBACK_VIDEOS = [
    { id: 'f1', url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", title: "Cinematic Highlight 1", author: "@StreamerCurated" },
    { id: 'f2', url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", title: "Sci-Fi Status Edit", author: "@AnimeEdits" },
    { id: 'f3', url: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", title: "Action Sequence 4K", author: "@MovieClips" },
    { id: 'f4', url: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", title: "Fantasy World", author: "@VisualArts" },
    { id: 'f5', url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", title: "Animation Highlight", author: "@ToonHub" },
    { id: 'f6', url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", title: "Urban Escape", author: "@CityVibes" },
    { id: 'f7', url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", title: "Neon Nights", author: "@NightOwl" },
    { id: 'f8', url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", title: "Late Night Drive", author: "@LofiBeats" },
    { id: 'f9', url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", title: "Intense Drama", author: "@CinemaShorts" },
    { id: 'f10', url: "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", title: "Offroad Adventure", author: "@MotorHead" }
];

const Status = () => {
    const [videos, setVideos] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    
    const videoRefs = useRef([]);
    const observerRef = useRef(null);

    const fetchVideos = async (pageNum) => {
        setIsLoading(true);
        try {
            const query = "cinematic abstract";
            const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=portrait&size=medium&per_page=5&page=${pageNum}`, {
                headers: { Authorization: FALLBACK_KEY }
            });
            
            if (!response.ok) throw new Error("API Limit Reached");
            const data = await response.json();
            
            const formattedVideos = data.videos.map(v => {
                const videoFile = v.video_files.find(file => file.file_type === 'video/mp4' && file.width >= 400) || v.video_files[0];
                return {
                    id: v.id.toString(),
                    url: videoFile.link,
                    title: `Visualizer ${v.id}`,
                    author: `@${v.user.name.replace(/\s+/g, '').toLowerCase()}`,
                    likes: `${Math.floor(Math.random() * 90 + 10)}.${Math.floor(Math.random() * 9)}K`
                };
            }).filter(v => v.url);

            if (formattedVideos.length === 0) throw new Error("Empty Array");

            setVideos(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const newVids = formattedVideos.filter(v => !existingIds.has(v.id));
                return [...prev, ...newVids];
            });
            
        } catch (err) {
            // UPGRADED: Graceful Degradation. If API fails, slice 5 videos from our secure local vault.
            console.log("Pexels API blocked or exhausted. Pivoting to Secure Fallback Vault.");
            
            // Mathematically loop through the 10 fallback videos forever based on the page number
            const startIndex = ((pageNum - 1) * 5) % FALLBACK_VIDEOS.length;
            let fallbackSlice = [];
            
            for (let i = 0; i < 5; i++) {
                const index = (startIndex + i) % FALLBACK_VIDEOS.length;
                fallbackSlice.push({
                    ...FALLBACK_VIDEOS[index],
                    // Generate a unique ID so React doesn't complain about duplicate keys during the infinite loop
                    id: `${FALLBACK_VIDEOS[index].id}-${pageNum}-${i}`, 
                    likes: `${Math.floor(Math.random() * 90 + 10)}.${Math.floor(Math.random() * 9)}K`
                });
            }

            setVideos(prev => [...prev, ...fallbackSlice]);
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

    useEffect(() => {
        const observerOptions = { root: null, rootMargin: '0px', threshold: 0.6 };

        const handleIntersection = (entries) => {
            entries.forEach((entry) => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    video.play().catch(e => console.log("Autoplay blocked"));
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
    }, [videos]);

    return (
        <div className="h-[calc(100vh-130px)] md:h-screen w-full bg-black flex justify-center overflow-hidden">
            <div className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative pb-20 md:pb-0">
                
                <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/20 transition active:scale-95 shadow-lg text-sm font-bold"
                >
                    {isMuted ? '🔇 Muted' : '🔊 Unmuted'}
                </button>

                {videos.map((video, index) => {
                    const isLastVideo = videos.length === index + 1;
                    
                    return (
                        <div 
                            key={video.id} 
                            ref={isLastVideo ? lastVideoElementRef : null} 
                            className="w-full h-full snap-start snap-always relative bg-gray-950 flex items-center justify-center"
                        >
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
                                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md group-hover:bg-green-500/80 shadow-lg text-lg">❤️</div>
                                    <span className="text-xs text-white font-semibold shadow-black drop-shadow-md">{video.likes}</span>
                                </button>
                                <button className="flex flex-col items-center gap-1 group transition active:scale-90">
                                    <div className="bg-gray-800/80 p-3 rounded-full backdrop-blur-md group-hover:bg-blue-500/80 shadow-lg text-lg">💬</div>
                                    <span className="text-xs text-white font-semibold shadow-black drop-shadow-md">Share</span>
                                </button>
                            </div>
                        </div>
                    );
                })}

                {isLoading && videos.length > 0 && (
                    <div className="w-full h-[15vh] snap-start bg-black flex items-center justify-center text-green-500 text-sm font-bold animate-pulse">
                        Loading more feed...
                    </div>
                )}
            </div>
        </div>
    );
};

export default Status;
