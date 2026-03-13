import { createContext, useState, useEffect, useRef } from 'react';

export const PlayerContext = createContext();

const cleanText = (str) => str ? str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'") : '';

export const PlayerProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [trackQueue, setTrackQueue] = useState([]); 
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const audioRef = useRef(new Audio());

    const playTrack = (track, queue = []) => {
        setCurrentTrack(track);
        if (queue.length > 0) setTrackQueue(queue);
        
        // UPGRADED: Recommendation Algorithm Data Logger
        const history = JSON.parse(localStorage.getItem('listening_history')) || [];
        const newHistory = [track, ...history.filter(t => t.id !== track.id)].slice(0, 30); // Store last 30 unique songs
        localStorage.setItem('listening_history', JSON.stringify(newHistory));
    };

    const playNext = () => {
        if (trackQueue.length === 0 || !currentTrack) return;
        const currentIndex = trackQueue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex !== -1 && currentIndex + 1 < trackQueue.length) setCurrentTrack(trackQueue[currentIndex + 1]);
    };

    const playPrevious = () => {
        if (trackQueue.length === 0 || !currentTrack) return;
        const currentIndex = trackQueue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex > 0) setCurrentTrack(trackQueue[currentIndex - 1]);
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (audio.paused) audio.play().catch(err => console.error("Playback blocked:", err));
        else audio.pause();
    };

    useEffect(() => {
        const audio = audioRef.current;
        const updatePlayState = () => setIsPlaying(!audio.paused);
        const handleEnded = () => playNext(); 
        audio.addEventListener('play', updatePlayState);
        audio.addEventListener('pause', updatePlayState);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('play', updatePlayState);
            audio.removeEventListener('pause', updatePlayState);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [trackQueue, currentTrack]); 

    useEffect(() => { audioRef.current.volume = volume; }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (currentTrack) {
            audio.src = currentTrack.audioUrl;
            audio.volume = volume;
            audio.play().catch(err => console.error("Playback blocked:", err));

            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: cleanText(currentTrack.title),
                    artist: cleanText(currentTrack.artist),
                    artwork: [
                        { src: currentTrack.cover, sizes: '96x96', type: 'image/jpeg' },
                        { src: currentTrack.cover, sizes: '512x512', type: 'image/jpeg' }
                    ]
                });
                navigator.mediaSession.setActionHandler('play', () => audio.play());
                navigator.mediaSession.setActionHandler('pause', () => audio.pause());
                navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
                navigator.mediaSession.setActionHandler('nexttrack', playNext);
            }
        }
    }, [currentTrack]);

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
