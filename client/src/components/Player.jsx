import { useContext, useEffect, useState, useRef } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { API_BASE_URL } from '../config';

const cleanText = (str) => str ? str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'") : '';

const Player = () => {
    const { currentTrack, playNext, playPrevious, isPlaying, togglePlay, closePlayer, volume, setVolume, playbackRate, setPlaybackRate, audioRef } = useContext(PlayerContext);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState('0:00');
    const [rawTime, setRawTime] = useState(0); 
    const [duration, setDuration] = useState('0:00');
    const [isMuted, setIsMuted] = useState(false);
    const [previousVolume, setPreviousVolume] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [sleepTimer, setSleepTimer] = useState(null); 
    
    // LYRICS ENGINE STATE
    const [showLyrics, setShowLyrics] = useState(false);
    const [lyricsData, setLyricsData] = useState({ trackId: null, lines: [], error: null, plain: false });
    const [lyricsLoading, setLyricsLoading] = useState(false);
    const [lyricOffset, setLyricOffset] = useState(0); // NEW: The Sync Nudge State
    const lyricsContainerRef = useRef(null);

    const formatTime = (time) => {
        if (isNaN(time) || time === Infinity) return '0:00';
        const m = Math.floor(time / 60);
        const s = Math.floor(time % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

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
                setRawTime(audio.currentTime); 
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
            setRawTime(newTime);
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
                alert(`🌙 Sleep timer set for ${parsed} minutes.`);
            }
        }
    };

    const cyclePlaybackRate = () => {
        const rates = [1, 1.25, 1.5, 2];
        const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
        setPlaybackRate(rates[nextIndex]);
    };

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

    // --- KARAOKE LYRICS ENGINE ---
    const fetchLyrics = async () => {
        if (!currentTrack) return;
        setLyricsLoading(true);
        setLyricsData({ trackId: currentTrack.id, lines: [], error: null, plain: false });
        
        try {
            const cleanTitle = cleanText(currentTrack.title).replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').split('-')[0].trim();
            const cleanArtist = cleanText(currentTrack.artist).split(',')[0].trim();
            
            const res = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`);
            if (!res.ok) throw new Error("Not found");
            const data = await res.json();
            
            if (data.syncedLyrics) {
                const lines = data.syncedLyrics.split('\n');
                const parsed = [];
                const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
                lines.forEach(line => {
                    const match = line.match(regex);
                    if (match) {
                        const min = parseInt(match[1], 10);
                        const sec = parseInt(match[2], 10);
                        const time = min * 60 + sec + parseInt(match[3].padEnd(3, '0')) / 1000;
                        const text = match[4].trim();
                        if (text) parsed.push({ time, text });
                    }
                });
                setLyricsData({ trackId: currentTrack.id, lines: parsed, error: null, plain: false });
            } else if (data.plainLyrics) {
                setLyricsData({ trackId: currentTrack.id, lines: [{ time: 0, text: data.plainLyrics }], error: null, plain: true });
            } else {
                 throw new Error("No lyrics");
            }
        } catch (err) {
            setLyricsData({ trackId: currentTrack.id, lines: [], error: "Synced lyrics not available for this track yet.", plain: false });
        }
        setLyricsLoading(false);
    };

    const toggleLyricsUI = () => {
        if (!showLyrics) {
            setShowLyrics(true);
            if (lyricsData.trackId !== currentTrack?.id) fetchLyrics();
        } else setShowLyrics(false);
    };

    useEffect(() => {
        if (showLyrics && currentTrack && lyricsData.trackId !== currentTrack.id) {
            setLyricOffset(0); // Reset offset on new track
            fetchLyrics();
        }
    }, [currentTrack]);

    // CALCULATE ACTIVE LINE USING USER'S SYNC OFFSET
    let activeIndex = -1;
    if (lyricsData.lines && !lyricsData.plain) {
        for (let i = 0; i < lyricsData.lines.length; i++) {
            // Include offset mathematically: If lyrics are early, positive offset delays them.
            if (rawTime + lyricOffset >= lyricsData.lines[i].time) activeIndex = i;
            else break;
        }
    }

    // Mathematical Auto-Scroller
    useEffect(() => {
        if (showLyrics && activeIndex !== -1 && !lyricsData.plain) {
            const activeEl = document.getElementById(`lyric-line-${activeIndex}`);
            if (activeEl && lyricsContainerRef.current) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeIndex, showLyrics]);

    if (!currentTrack) return null;

    return (
        <>
            {/* --- THE NEW FLOATING LYRICS WIDGET --- */}
            <div className={`fixed bottom-[136px] md:bottom-[104px] right-2 md:right-6 w-[calc(100%-16px)] md:w-[400px] h-[55vh] md:h-[65vh] z-40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col items-center justify-start rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-gray-700/50 ${showLyrics ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
                
                <div className="absolute inset-0 bg-cover bg-center blur-[30px] opacity-60 scale-125 transition-all duration-1000" style={{ backgroundImage: `url(${currentTrack?.cover})` }}></div>
                <div className="absolute inset-0 bg-gray-950/70 backdrop-blur-md"></div>
                
                {/* Header & Sync Nudge Controls */}
                <div className="absolute top-0 w-full p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-1 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm border border-gray-500/30 shadow-inner">
                        <button onClick={() => setLyricOffset(prev => prev - 0.5)} className="text-gray-400 hover:text-white px-2 text-sm font-bold active:scale-90 transition" title="Lyrics are too early? Delay them.">-0.5s</button>
                        <span className="text-green-400 text-[10px] md:text-xs font-mono w-10 text-center tracking-tighter">Sync {lyricOffset > 0 ? '+' : ''}{lyricOffset}s</span>
                        <button onClick={() => setLyricOffset(prev => prev + 0.5)} className="text-gray-400 hover:text-white px-2 text-sm font-bold active:scale-90 transition" title="Lyrics are too late? Advance them.">+0.5s</button>
                    </div>
                    <button onClick={toggleLyricsUI} className="text-gray-400 hover:text-white text-xl bg-black/50 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border border-gray-500/30 transition active:scale-90">✕</button>
                </div>
                
                <div className="z-40 w-full px-6 h-full overflow-y-auto scrollbar-hide text-center flex flex-col relative pt-16 pb-32" ref={lyricsContainerRef} style={{ scrollBehavior: 'smooth' }}>
                    <div className="min-h-[20vh] flex-shrink-0"></div>

                    {lyricsLoading && <p className="text-gray-400 animate-pulse text-sm mt-10">Syncing database...</p>}
                    
                    {lyricsData.error && (
                        <div className="mt-10 p-4 bg-red-900/20 border border-red-800 rounded-2xl mx-auto w-full">
                            <p className="text-red-400 text-sm font-bold">{lyricsData.error}</p>
                            <p className="text-gray-500 text-[10px] mt-2">Regional tracks often lack timestamped data.</p>
                        </div>
                    )}
                    
                    {lyricsData.plain && <div className="text-gray-300 mt-10 whitespace-pre-wrap leading-[2.5] text-sm font-medium tracking-wide">{lyricsData.lines[0].text}</div>}
                    
                    {!lyricsLoading && !lyricsData.error && !lyricsData.plain && lyricsData.lines?.map((line, idx) => (
                        <p 
                            key={idx} 
                            id={`lyric-line-${idx}`} 
                            onClick={() => {
                                if(audioRef.current && audioRef.current.duration) {
                                    const targetTime = Math.max(0, line.time - lyricOffset); // Adjust jump for current sync
                                    audioRef.current.currentTime = targetTime;
                                    setRawTime(targetTime);
                                }
                            }}
                            className={`text-lg md:text-2xl font-extrabold my-3 transition-all duration-300 ease-out cursor-pointer hover:text-white ${activeIndex === idx ? 'text-green-400 scale-[1.05] drop-shadow-[0_0_15px_rgba(34,197,94,0.6)] opacity-100' : 'text-gray-500/50 opacity-40 scale-95'}`}
                        >
                            {line.text}
                        </p>
                    ))}

                    <div className="min-h-[30vh] flex-shrink-0"></div>
                </div>
            </div>

            {/* --- THE MAIN PLAYER BAR --- */}
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
                            
                            <button onClick={toggleLyricsUI} className={`text-[10px] md:text-xs transition flex-shrink-0 ${showLyrics ? 'text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'text-gray-400 hover:text-white'}`} title="Karaoke Mode">📝</button>
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
        </>
    );
};

export default Player;
