import { createContext, useState, useEffect, useRef } from 'react';

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [trackQueue, setTrackQueue] = useState([]); 
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const audioRef = useRef(new Audio());

    const playTrack = (track, queue = []) => {
        setCurrentTrack(track);
        if (queue.length > 0) setTrackQueue(queue);
    };

    // NEW: Manual Next Button Logic
    const playNext = () => {
        if (trackQueue.length === 0 || !currentTrack) return;
        const currentIndex = trackQueue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex !== -1 && currentIndex + 1 < trackQueue.length) {
            setCurrentTrack(trackQueue[currentIndex + 1]);
        }
    };

    // NEW: Manual Previous Button Logic
    const playPrevious = () => {
        if (trackQueue.length === 0 || !currentTrack) return;
        const currentIndex = trackQueue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex > 0) {
            setCurrentTrack(trackQueue[currentIndex - 1]);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        const updatePlayState = () => setIsPlaying(!audio.paused);
        const handleEnded = () => playNext(); // Auto-play relies on the exact same logic
        
        audio.addEventListener('play', updatePlayState);
        audio.addEventListener('pause', updatePlayState);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('play', updatePlayState);
            audio.removeEventListener('pause', updatePlayState);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [trackQueue, currentTrack]); // Added dependencies to ensure it tracks correctly

    useEffect(() => { audioRef.current.volume = volume; }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (currentTrack) {
            audio.src = currentTrack.audioUrl;
            audio.volume = volume;
            audio.play().catch(err => console.error("Playback blocked:", err));
        }
    }, [currentTrack]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (audio.paused) audio.play().catch(err => console.error("Playback blocked:", err));
        else audio.pause();
    };

    const closePlayer = () => {
        const audio = audioRef.current;
        audio.pause();
        audio.currentTime = 0;
        setCurrentTrack(null);
        setTrackQueue([]);
        setIsPlaying(false);
    };

    return (
        <PlayerContext.Provider value={{ currentTrack, playTrack, playNext, playPrevious, isPlaying, togglePlay, closePlayer, volume, setVolume, audioRef }}>
            {children}
        </PlayerContext.Provider>
    );
};
