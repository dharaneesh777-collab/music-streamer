import { createContext, useState, useEffect } from 'react';

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audio] = useState(() => new Audio());

    useEffect(() => {
        const updatePlayState = () => setIsPlaying(!audio.paused);
        const handleEnded = () => setIsPlaying(false);
        
        audio.addEventListener('play', updatePlayState);
        audio.addEventListener('pause', updatePlayState);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('play', updatePlayState);
            audio.removeEventListener('pause', updatePlayState);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audio]);

    useEffect(() => {
        if (currentTrack) {
            audio.src = currentTrack.audioUrl;
            audio.play().catch(err => console.error("Playback blocked:", err));
        }
    }, [currentTrack, audio]);

    const togglePlay = () => {
        if (audio.paused) audio.play().catch(err => console.error("Playback blocked:", err));
        else audio.pause();
    };

    // NEW: Function to completely halt and dismiss the player
    const closePlayer = () => {
        audio.pause();
        audio.currentTime = 0;
        setCurrentTrack(null);
        setIsPlaying(false);
    };

    return (
        <PlayerContext.Provider value={{ currentTrack, setCurrentTrack, isPlaying, togglePlay, closePlayer, audioRef: { current: audio } }}>
            {children}
        </PlayerContext.Provider>
    );
};
