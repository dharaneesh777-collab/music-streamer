import { createContext, useState, useEffect, useRef } from 'react';

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [trackQueue, setTrackQueue] = useState([]); // NEW: Holds the entire playlist for auto-play
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const audioRef = useRef(new Audio());

    const playTrack = (track, queue = []) => {
        setCurrentTrack(track);
        if (queue.length > 0) setTrackQueue(queue);
    };

    useEffect(() => {
        const audio = audioRef.current;
        const updatePlayState = () => setIsPlaying(!audio.paused);
        
        // UPGRADED: Logic to automatically find and play the next song in the queue
        const handleEnded = () => {
            setTrackQueue(prevQueue => {
                setCurrentTrack(prevTrack => {
                    if (!prevTrack || prevQueue.length === 0) {
                        setIsPlaying(false);
                        return prevTrack;
                    }
                    const currentIndex = prevQueue.findIndex(t => t.id === prevTrack.id);
                    if (currentIndex !== -1 && currentIndex + 1 < prevQueue.length) {
                        return prevQueue[currentIndex + 1]; 
                    }
                    setIsPlaying(false);
                    return prevTrack;
                });
                return prevQueue;
            });
        };
        
        audio.addEventListener('play', updatePlayState);
        audio.addEventListener('pause', updatePlayState);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('play', updatePlayState);
            audio.removeEventListener('pause', updatePlayState);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

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
        <PlayerContext.Provider value={{ currentTrack, playTrack, isPlaying, togglePlay, closePlayer, volume, setVolume, audioRef }}>
            {children}
        </PlayerContext.Provider>
    );
};
