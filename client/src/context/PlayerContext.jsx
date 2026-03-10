import { createContext, useState, useEffect, useRef } from 'react';

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const audioRef = useRef(new Audio());

    useEffect(() => {
        const audio = audioRef.current;
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
    }, []);

    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);

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
        setIsPlaying(false);
    };

    return (
        <PlayerContext.Provider value={{ currentTrack, setCurrentTrack, isPlaying, togglePlay, closePlayer, volume, setVolume, audioRef }}>
            {children}
        </PlayerContext.Provider>
    );
};
