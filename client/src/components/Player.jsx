import { useContext, useEffect, useState, useRef } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { API_BASE_URL } from '../config';

const Player = () => {
    const { currentTrack, isPlaying, togglePlay, closePlayer, volume, setVolume, audioRef } = useContext(PlayerContext);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState('0:00');
    const [duration, setDuration] = useState('0:00');
    const [isMuted, setIsMuted] = useState(false);
    const [previousVolume, setPreviousVolume] = useState(1);
    const progressBarRef = useRef(null);

    const formatTime = (time) => {
        if (isNaN(time) || time === Infinity) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                togglePlay();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const updateProgress = () => {
            if (audio.duration) {
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
    }, [audioRef]);

    const handleSeek = (e) => {
        const audio = audioRef.current;
        const bar = progressBarRef.current;
        if (audio && bar && audio.duration) {
            const rect = bar.getBoundingClientRect();
            let clickX = e.clientX - rect.left;
            clickX = Math.max(0, Math.min(clickX, rect.width)); 
            audio.currentTime = (clickX / rect.width) * audio.duration;
        }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (newVolume > 0) setIsMuted(false);
        else setIsMuted(true);
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
            alert(`"${currentTrack.title}" added to your playlist!`);
        } else {
            alert(`"${currentTrack.title}" is already in your playlist.`);
        }
    };

    const handleDownload = () => {
        if (!currentTrack) return;
        const downloadUrl = `${API_BASE_URL}/api/download?url=${encodeURIComponent(currentTrack.audioUrl)}&title=${encodeURIComponent(currentTrack.title)}`;
        window.open(downloadUrl, '_blank');
    };

    if (!currentTrack) return null;

    return (
        <div className="fixed bottom-0 w-full h-24 bg-gray-950/80 backdrop-blur-xl border-t border-gray-800/50 flex items-center px-4 md:px-6 justify-between z-50 shadow-2xl">
            <style>
                {`
                    @keyframes eqAnim { 0% { height: 20%; } 50% { height: 100%; } 100% { height: 40%; } }
                    .eq-bar { animation: eqAnim 1s ease-in-out infinite alternate; transform-origin: bottom; }
                    input[type=range]::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; background: #22c55e; border-radius: 50%; cursor: pointer; }
                `}
            </style>

            <div className="flex items-center gap-3 w-1/2 md:w-1/4">
                <img src={currentTrack.cover} alt="Cover" className="h-10 w-10 md:h-14 md:w-14 rounded shadow-lg" />
                <div className="flex flex-col max-w-[120px] md:max-w-[200px]">
                    <h4 className="text-xs md:text-sm font-bold truncate">{currentTrack.title}</h4>
                    <p className="text-[10px] md:text-xs text-gray-400 truncate">{currentTrack.artist}</p>
                </div>
                <div className={`hidden md:flex items-end gap-[2px] h-6 ml-4 transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-20'}`}>
                    <div className="w-1.5 bg-green-500 rounded-t-sm eq-bar" style={{ animationDelay: '0.0s' }}></div>
                    <div className="w-1.5 bg-green-500 rounded-t-sm eq-bar" style={{ animationDelay: '0.2s', animationDuration: '0.8s' }}></div>
                    <div className="w-1.5 bg-green-500 rounded-t-sm eq-bar" style={{ animationDelay: '0.4s', animationDuration: '1.2s' }}></div>
                </div>
            </div>

            <div className="flex flex-col items-center w-auto md:w-2/4">
                <div className="flex gap-4 items-center">
                    <button className="hidden md:block text-gray-400 hover:text-white transition">⏮</button>
                    <button onClick={togglePlay} className="h-10 w-10 md:h-12 md:w-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition shadow-xl">
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                    <button className="hidden md:block text-gray-400 hover:text-white transition">⏭</button>
                </div>
                
                <div className="hidden md:flex w-full mt-2 items-center gap-3 max-w-xl">
                    <span className="text-xs text-gray-400 w-8 text-right font-mono">{currentTime}</span>
                    <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full cursor-pointer flex items-center hover:h-2 transition-all relative" onClick={handleSeek} ref={progressBarRef}>
                        <div className="h-full bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-400 w-8 font-mono">{duration}</span>
                </div>
            </div>

            <div className="md:hidden absolute top-0 left-0 w-full h-1 bg-gray-800 cursor-pointer" onClick={handleSeek} ref={progressBarRef}>
                <div className="h-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="w-auto md:w-1/4 flex justify-end items-center gap-4 md:gap-5 pr-2">
                <div className="hidden md:flex items-center gap-2 mr-2">
                    <button onClick={toggleMute} className="text-gray-400 hover:text-white transition text-lg w-6">
                        {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                    </button>
                    <input 
                        type="range" min="0" max="1" step="0.01" 
                        value={volume} onChange={handleVolumeChange}
                        className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, #22c55e ${volume * 100}%, #374151 ${volume * 100}%)` }}
                    />
                </div>

                <button onClick={handleAddToPlaylist} className="text-gray-400 hover:text-green-500 transition text-lg md:text-xl" title="Add to Playlist">➕</button>
                <button onClick={handleDownload} className="hidden lg:block text-gray-400 hover:text-white transition text-xl" title="Download Offline">⬇️</button>
                <div className="w-px h-6 md:h-8 bg-gray-700/50 mx-1"></div>
                <button onClick={closePlayer} className="text-gray-500 hover:text-red-500 transition text-xl md:text-2xl font-bold" title="Close Player">✕</button>
            </div>
        </div>
    );
};

export default Player;
