import { useEffect, useRef, useState } from 'react';

const Status = () => {
    const [isMuted, setIsMuted] = useState(true);
    const videoRefs = useRef([]);

    // Sample high-quality open-source video URLs (Replace these with your own self-hosted anime/music MP4 links)
    const statusVideos = [
        {
            id: 1,
            url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            title: "Cinematic Highlight 1",
            author: "@StreamerCurated",
            likes: "12.4K"
        },
        {
            id: 2,
            url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            title: "Sci-Fi Status Edit",
            author: "@AnimeEdits",
            likes: "8.9K"
        },
        {
            id: 3,
            url: "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
            title: "Action Sequence 4K",
            author: "@MovieClips",
            likes: "45.1K"
        }
    ];

    // Intersection Observer to auto-play the video currently in view and pause the rest
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.6 // Video must be 60% visible to trigger
        };

        const handleIntersection = (entries) => {
            entries.forEach((entry) => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    video.play().catch(err => console.log("Autoplay prevented:", err));
                } else {
                    video.pause();
                    video.currentTime = 0; // Reset video when scrolled away
                }
            });
        };

        const observer = new IntersectionObserver(handleIntersection, observerOptions);

        videoRefs.current.forEach((video) => {
            if (video) observer.observe(video);
        });

        return () => {
            videoRefs.current.forEach((video) => {
                if (video) observer.unobserve(video);
            });
        };
    }, []);

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    return (
        <div className="h-[calc(100vh-130px)] md:h-screen w-full bg-black flex justify-center overflow-hidden">
            {/* Scroll-Snapping Container */}
            <div className="w-full max-w-md h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide relative pb-20 md:pb-0">
                
                {/* Global Mute Toggle */}
                <button 
                    onClick={toggleMute}
                    className="absolute top-4 right-4 z-50 bg-black/50 backdrop-blur-md text-white p-3 rounded-full border border-white/20 transition active:scale-95"
                >
                    {isMuted ? '🔇 Muted' : '🔊 Unmuted'}
                </button>

                {statusVideos.map((video, index) => (
                    <div key={video.id} className="w-full h-full snap-start snap-always relative bg-gray-900 flex items-center justify-center">
                        
                        <video
                            ref={(el) => (videoRefs.current[index] = el)}
                            src={video.url}
                            className="w-full h-full object-cover"
                            loop
                            muted={isMuted}
                            playsInline
                        />

                        {/* Video Metadata Overlay */}
                        <div className="absolute bottom-6 left-4 right-16 text-white z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 rounded-xl">
                            <h3 className="font-bold text-lg">{video.author}</h3>
                            <p className="text-sm text-gray-200 mt-1">{video.title}</p>
                        </div>

                        {/* Interactive Action Buttons */}
                        <div className="absolute bottom-6 right-4 flex flex-col items-center gap-6 z-10">
                            <button className="flex flex-col items-center gap-1 group">
                                <div className="bg-gray-800/60 p-3 rounded-full backdrop-blur-sm group-hover:bg-green-500/80 transition">❤️</div>
                                <span className="text-xs text-white font-semibold">{video.likes}</span>
                            </button>
                            <button className="flex flex-col items-center gap-1 group">
                                <div className="bg-gray-800/60 p-3 rounded-full backdrop-blur-sm group-hover:bg-blue-500/80 transition">💬</div>
                                <span className="text-xs text-white font-semibold">Share</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Status;
