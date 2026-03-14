import { useContext, useEffect, useState, useRef } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { API_BASE_URL } from '../config';

const cleanText = (str) => str ? str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'") : '';

const Player = () => {
    const { currentTrack, playNext, playPrevious, isPlaying, togglePlay, closePlayer, volume, setVolume, playbackRate, setPlaybackRate, audioRef } = useContext(PlayerContext);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState('0:00');
    const [duration, setDuration] = useState('0:00');
    const [isMuted, setIsMuted] = useState(false);
    const [previousVolume, setPreviousVolume] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [sleepTimer, setSleepTimer] = useState(null); 

    const formatTime = (time) => {
        if (isNaN(time) || time === Infinity) return '0:00';
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // UPGRADED: Added Pro Keyboard Navigation (Arrows)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (document.activeElement.tagName === 'INPUT') return;
            if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
            if (e.code === 'ArrowRight') { e.preventDefault(); playNext(); }
            if (e.code === 'ArrowLeft') { e.preventDefault(); playPrevious(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, playNext, playPrevious]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const updateProgress = () => {
            if (audio.duration && !isDragging) {
                setProgress((audio.currentTime / audio.duration) * 100);
                setCurrentTime(formatTime(audio.currentTime));
            }
        };
        const updateDuration = () => setDuration(formatTime(audio.duration));
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateDuration);
        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', updateDuration);
        };
    }, [audioRef, isDragging]);

    const handleSeekEnd = (e) => {
        setIsDragging(false);
        const audio = audioRef.current;
        const newTime = (e.target.value / 100) * audio.duration;
        if (audio && audio.duration) {
            audio.currentTime = newTime;
            setProgress(e.target.value);
            setCurrentTime(formatTime(newTime));
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume <= 0);
    };

    const toggleMute = () => {
        if (isMuted) {
            setVolume(previousVolume > 0 ? previousVolume : 1);
            setIsMuted(false);
        } else {
            setPreviousVolume(volume);
            setVolume(0);
            setIsMuted(true);
        }
    };

    const handleAddToPlaylist = () => {
        if (!currentTrack) return;
        const existingPlaylist = JSON.parse(localStorage.getItem('my_playlist')) || [];
        if (!existingPlaylist.find(t => t.id === currentTrack.id)) {
            existingPlaylist.push(currentTrack);
            localStorage.setItem('my_playlist', JSON.stringify(existingPlaylist));
            alert(`"${cleanText(currentTrack.title)}" added to your playlist!`);
        } else alert(`"${cleanText(currentTrack.title)}" is already in your playlist.`);
    };

    const handleDownload = () => {
        if (!currentTrack) return;
        const downloadUrl = `${API_BASE_URL}/api/download?url=${encodeURIComponent(currentTrack.audioUrl)}&title=${encodeURIComponent(currentTrack.title)}`;
        window.open(downloadUrl, '_blank');
    };

    const handleSleepTimer = () => {
        if (sleepTimer) {
            clearTimeout(sleepTimer);
            setSleepTimer(null);
            alert("🌙 Sleep timer canceled.");
        } else {
            const mins = prompt("Enter sleep timer in minutes (e.g., 15, 30, 60):", "30");
            const parsed = parseInt(mins);
            if (!isNaN(parsed) && parsed > 0) {
                const timer = setTimeout(() => {
                    audioRef.current.pause();
                    setSleepTimer(null);
                }, parsed * 60000);
                setSleepTimer(timer);
                alert(`🌙 Sleep timer set for ${parsed} minutes. Music will pause automatically.`);
            }
        }
    };

    const cyclePlaybackRate = () => {
        const rates = [1, 1.25, 1.5, 2];
        const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
        setPlaybackRate(rates[nextIndex]);
    };

    // NEW FEATURE: OS-Level Mobile Sharing API
    const handleShare = async () => {
        if (!currentTrack) return;
        const shareData = {
            title: cleanText(currentTrack.title),
            text: `Listening to ${cleanText(currentTrack.title)} by ${cleanText(currentTrack.artist)} on Streamer!`,
            url: window.location.origin
        };
        try {
            if (navigator.share) await navigator.share(shareData);
            else {
                navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                alert("Link copied to clipboard!");
            }
        } catch(e) {}
    };

    // NEW FEATURE: Instant Google Lyrics Finder
    const handleLyrics = () => {
        if (!currentTrack) return;
        const query = `${cleanText(currentTrack.title)} ${cleanText(currentTrack.artist)} lyrics`;
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    };

    if (!currentTrack) return null;

    return (
        <div className="fixed bottom-16 md:bottom-0 left-0 w-full h-16 md:h-24 bg-gray-950/90 backdrop-blur-xl border-t border-gray-800/50 flex items-center px-2 md:px-6 justify-between z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] touch-none">
            <style>
                {`
                    @keyframes eqAnim { 0% { height: 20%; } 50% { height: 100%; } 100% { height: 40%; } }
                    .eq-bar { animation: eqAnim 1s ease-in-out infinite alternate; transform-origin: bottom; }
                    input[type=range]::-webkit-slider-thumb { appearance: none; width: 14px; height: 14px; background: #22c55e; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5); }
                    .seek-bar::-webkit-slider-thumb { width: 1px; height: 1px; background: transparent; border: none; }
                    @media (min-width: 768px) { .seek-bar::-webkit-slider-thumb { width: 14px; height: 14px; background: #22c55e; } }
                `}
            </style>

            <div className="md:hidden absolute top-[-4px] left-0 w-full h-2">
                 <input 
                    type="range" min="0" max="100" step="0.1" value={progress}
                    onMouseDown={() => setIsDragging(true)} onTouchStart={() => setIsDragging(true)}
                    onChange={(e) => setProgress(e.target.value)}
                    onMouseUp={handleSeekEnd} onTouchEnd={handleSeekEnd}
                    className="seek-bar w-full h-full bg-gray-800 appearance-none cursor-pointer m-0"
                    style={{ background: `linear-gradient(to right, #22c55e ${progress}%, #1f2937 ${progress}%)` }}
                />
            </div>

            <div className="flex items-center gap-2 md:gap-3 w-[45%] md:w-1/4 overflow-hidden">
                <img src={currentTrack.cover} alt="Cover" className="h-10 w-10 md:h-14 md:w-14 rounded shadow-lg flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                    <h4 className="text-[11px] md:text-sm font-bold truncate">{cleanText(currentTrack.title)}</h4>
                    <div className="flex items-center gap-2">
                        <p className="text-[9px] md:text-xs text-gray-400 truncate max-w-[60px] md:max-w-[120px]">{cleanText(currentTrack.artist)}</p>
                        
                        {/* INJECTED SMART UI: Lyrics and Share tools embedded smoothly here */}
                        <button onClick={handleLyrics} className="text-[10px] md:text-xs text-gray-400 hover:text-white transition flex-shrink-0" title="Find Lyrics">📝</button>
                        <button onClick={handleShare} className="text-[10px] md:text-xs text-gray-400 hover:text-white transition flex-shrink-0" title="Share Song">🔗</button>
                        
                        <span className="md:hidden text-[8px] text-green-500 font-mono tracking-tighter bg-green-900/20 px-1 rounded ml-auto">{currentTime} / {duration}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center w-[55%] md:w-2/4">
                <div className="flex gap-2 md:gap-6 items-center justify-end md:justify-center w-full">
                    <button onClick={handleSleepTimer} className={`md:hidden transition text-lg flex-shrink-0 mr-1 ${sleepTimer ? 'text-indigo-400 animate-pulse' : 'text-gray-400 hover:text-indigo-400'}`}>🌙</button>
                    <button onClick={handleAddToPlaylist} className="md:hidden text-gray-400 hover:text-green-500 transition text-lg flex-shrink-0 mr-1">➕</button>
                    
                    <button onClick={playPrevious} className="text-gray-400 hover:text-white transition active:scale-95 text-xl md:text-2xl">⏮</button>
                    <button onClick={togglePlay} className="h-10 w-10 md:h-12 md:w-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition shadow-xl flex-shrink-0">
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                    <button onClick={playNext} className="text-gray-400 hover:text-white transition active:scale-95 text-xl md:text-2xl">⏭</button>
                    
                    <button onClick={cyclePlaybackRate} className="md:hidden text-gray-400 hover:text-white transition text-[10px] font-bold flex-shrink-0 ml-1 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">{playbackRate}x</button>
                    <button onClick={closePlayer} className="md:hidden text-gray-500 hover:text-red-500 transition text-lg font-bold ml-1 flex-shrink-0">✕</button>
                </div>
                
                <div className="hidden md:flex w-full mt-2 items-center gap-3 max-w-xl">
                    <span className="text-xs text-gray-400 w-8 text-right font-mono">{currentTime}</span>
                    <input 
                        type="range" min="0" max="100" step="0.1" value={progress}
                        onMouseDown={() => setIsDragging(true)} onChange={(e) => setProgress(e.target.value)} onMouseUp={handleSeekEnd}
                        className="seek-bar flex-1 h-1.5 bg-gray-700/50 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, #22c55e ${progress}%, #374151 ${progress}%)` }}
                    />
                    <span className="text-xs text-gray-400 w-8 font-mono">{duration}</span>
                </div>
            </div>

            <div className="hidden md:flex w-1/4 justify-end items-center gap-4 pr-2">
                <div className="flex items-center gap-2 mr-2">
                    <button onClick={toggleMute} className="text-gray-400 hover:text-white transition text-lg w-6">
                        {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                    </button>
                    <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #22c55e ${volume * 100}%, #374151 ${volume * 100}%)` }} />
                </div>
                
                <button onClick={handleSleepTimer} className={`transition text-xl ${sleepTimer ? 'text-indigo-400 animate-pulse' : 'text-gray-400 hover:text-indigo-400'}`} title="Sleep Timer">🌙</button>
                <button onClick={cyclePlaybackRate} className="text-gray-400 hover:text-white transition text-xs font-bold bg-gray-800 px-2 py-1 rounded border border-gray-700" title="Playback Speed">{playbackRate}x</button>
                
                <button onClick={handleAddToPlaylist} className="text-gray-400 hover:text-green-500 transition text-xl" title="Add to Playlist">➕</button>
                <button onClick={handleDownload} className="text-gray-400 hover:text-white transition text-xl" title="Download Offline">⬇️</button>
                <div className="w-px h-8 bg-gray-700/50 mx-1"></div>
                <button onClick={closePlayer} className="text-gray-500 hover:text-red-500 transition text-2xl font-bold" title="Close Player">✕</button>
            </div>
        </div>
    );
};

export default Player;
