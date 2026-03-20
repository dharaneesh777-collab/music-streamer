const axios = require('axios');

const ARTIST_QUERIES = { 'ar_rahman': 'A.R. Rahman', 'anirudh': 'Anirudh Ravichander', 'ilaiyaraaja': 'Ilaiyaraaja', 'yuvan': 'Yuvan Shankar Raja', 'harris_jayaraj': 'Harris Jayaraj' };
const SAAVN_PROXIES = ['https://saavn.sumit.co/api/search/songs', 'https://saavn.dev/api/search/songs', 'https://jiosaavn-api-sigma-sandy.vercel.app/api/search/songs'];

const getFullLengthAudio = (track) => {
    const downloadUrls = track.downloadUrl || track.download_url || track.media_urls || track.urls;
    if (Array.isArray(downloadUrls) && downloadUrls.length > 0) {
        const hq = downloadUrls.find(u => u.quality === '320kbps') || downloadUrls.find(u => u.quality === '160kbps') || downloadUrls[downloadUrls.length - 1];
        return hq.url || hq.link || hq;
    }
    const directUrl = track.media_url || track.url || track.downloadUrl;
    if (typeof directUrl === 'string' && directUrl.startsWith('http') && !directUrl.includes('preview')) return directUrl;
    return null; 
};

const getHighQualityImage = (track) => {
    const images = track.image || track.images || track.artwork;
    if (Array.isArray(images) && images.length > 0) return images[images.length - 1].url || images[images.length - 1].link || images[images.length - 1];
    return 'https://via.placeholder.com/300';
};

const deduplicateTracks = (tracks) => {
    const uniqueTracks = [];
    const seenNames = new Set();
    tracks.forEach(track => {
        const cleanName = track.title.toLowerCase().replace(/\(from.*?\)/gi, '').replace(/[^a-z]/gi, '').trim();
        if (track.tag !== 'Original' || !seenNames.has(cleanName)) {
            if (track.tag === 'Original') seenNames.add(cleanName);
            uniqueTracks.push(track);
        }
    });
    return uniqueTracks;
};

const fetchFromSaavn = async (query) => {
    const promises = SAAVN_PROXIES.map(proxy => 
        axios.get(`${proxy}?query=${query}`, { timeout: 4500 })
            .then(res => {
                const results = res.data?.data?.results || res.data?.results || (Array.isArray(res.data) ? res.data : []);
                if (results.length > 0) return results;
                throw new Error("Empty payload");
            })
    );
    try { return await Promise.any(promises); } catch (err) { return []; }
};

const hybridFetch = async (itunesTracks, req) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const promises = itunesTracks.map(async (entry) => {
        const title = entry.trackName || entry['im:name']?.label;
        const artist = entry.artistName || entry['im:artist']?.label;
        const cover = (entry.artworkUrl100 ? entry.artworkUrl100.replace('100x100bb', '300x300bb') : null) || (entry['im:image'] && entry['im:image'][2]?.label) || 'https://via.placeholder.com/300';
        
        const targetDuration = entry.trackTimeMillis ? entry.trackTimeMillis / 1000 : null;
        const saavnQuery = `${title} ${artist}`.replace(/[^a-zA-Z0-9 ]/g, " ");

        for (const proxy of SAAVN_PROXIES) {
            try {
                const saavnRes = await axios.get(`${proxy}?query=${encodeURIComponent(saavnQuery)}&limit=6`, { timeout: 4500 });
                const saavnData = saavnRes.data?.data?.results || saavnRes.data?.results || [];
                
                if (saavnData.length > 0) {
                    let bestMatch = null;
                    let minDiff = Infinity;

                    for (const t of saavnData) {
                        const tTitle = (t.name || t.title || "").toLowerCase();
                        const isCover = title.toLowerCase().includes('cover');
                        const isLive = title.toLowerCase().includes('live');

                        if (!isCover && (tTitle.includes('cover') || tTitle.includes('tribute'))) continue;
                        if (!isLive && tTitle.includes('live')) continue;
                        if (tTitle.includes('instrumental') || tTitle.includes('karaoke') || tTitle.includes('commentary') || tTitle.includes('dialogue')) continue;

                        if (targetDuration && t.duration) {
                            const diff = Math.abs(t.duration - targetDuration);
                            if (diff < minDiff) { minDiff = diff; bestMatch = t; }
                        } else if (!bestMatch) {
                            bestMatch = t;
                        }
                    }

                    if (!bestMatch) bestMatch = saavnData[0]; 

                    const originalUrl = getFullLengthAudio(bestMatch);
                    if (originalUrl) {
                        return {
                            id: bestMatch.id || Math.random().toString(),
                            title: title, artist: artist, cover: cover, 
                            audioUrl: `${baseUrl}/api/stream?url=${encodeURIComponent(originalUrl)}`,
                            duration: bestMatch.duration || 180, tag: 'Original'
                        };
                    }
                }
            } catch(e) {}
        }
        return null;
    });

    const results = await Promise.all(promises);
    return results.filter(track => track !== null);
};

const processResults = (results, req, targetLang = 'all') => {
    if (!results || !Array.isArray(results)) return [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    return results.map(track => {
        const trackLang = String(track.language || (track.more_info && track.more_info.language) || "").toLowerCase();
        if (targetLang !== 'all' && targetLang !== 'english' && targetLang !== 'japanese') {
            if (!trackLang.includes(targetLang)) return null; 
        }

        const tTitle = String(track.name || track.title || "").toLowerCase();
        const tAlbum = String(track.album?.name || track.album?.title || track.more_info?.album || "").toLowerCase();
        if (tTitle.includes('nursery') || tTitle.includes('rhymes') || tTitle.includes('kids') || tAlbum.includes('nursery') || tAlbum.includes('rhymes')) return null;

        const originalUrl = getFullLengthAudio(track);
        return {
            id: track.id || Math.random().toString(),
            title: track.name || track.title, artist: track.artists?.primary?.[0]?.name || track.primaryArtists || 'Unknown Artist',
            cover: getHighQualityImage(track), audioUrl: originalUrl ? `${baseUrl}/api/stream?url=${encodeURIComponent(originalUrl)}` : null, 
            duration: track.duration || 180, tag: (track.name || track.title || "").toLowerCase().includes('remix') ? 'Remix' : 'Original'
        };
    }).filter(track => track !== null && track.audioUrl);
};

// --- NEW BACKEND VIDEO SOURCE (MIXKIT CDN) ---
// This permanently bypasses Pexels API limits and guarantees ultra-high quality music/neon status videos
const getStatusVideos = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const curatedVideos = [
        { id: 'v1', url: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4", title: "Neon City Aesthetic", author: "@CyberVibes" },
        { id: 'v2', url: "https://assets.mixkit.co/videos/preview/mixkit-dj-playing-music-at-a-nightclub-43400-large.mp4", title: "Club DJ Set", author: "@RaveHouse" },
        { id: 'v3', url: "https://assets.mixkit.co/videos/preview/mixkit-abstract-video-of-a-man-with-neon-lights-42491-large.mp4", title: "Abstract Frequency", author: "@Visualizer" },
        { id: 'v4', url: "https://assets.mixkit.co/videos/preview/mixkit-driving-in-the-rain-at-night-5434-large.mp4", title: "Late Night Lofi", author: "@MidnightDrives" },
        { id: 'v5', url: "https://assets.mixkit.co/videos/preview/mixkit-crowd-dancing-in-a-nightclub-4351-large.mp4", title: "Festival Energy", author: "@LiveMusic" },
        { id: 'v6', url: "https://assets.mixkit.co/videos/preview/mixkit-playing-a-bass-guitar-1111-large.mp4", title: "Bass Groove", author: "@StringsAttached" },
        { id: 'v7', url: "https://assets.mixkit.co/videos/preview/mixkit-silhouette-of-a-man-dancing-in-the-dark-42469-large.mp4", title: "Rhythm & Shadows", author: "@DanceEdits" },
        { id: 'v8', url: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-listening-to-music-on-headphones-42456-large.mp4", title: "Lost in the Track", author: "@Audiophile" },
        { id: 'v9', url: "https://assets.mixkit.co/videos/preview/mixkit-cassette-playing-in-a-vintage-stereo-48332-large.mp4", title: "Retro Mixtape", author: "@VintageSounds" },
        { id: 'v10', url: "https://assets.mixkit.co/videos/preview/mixkit-drummer-playing-drums-in-a-studio-43404-large.mp4", title: "Studio Sessions", author: "@BeatMaker" }
    ];

    // Mathematically loop the array infinitely for seamless scrolling
    const startIndex = ((page - 1) * limit) % curatedVideos.length;
    let paginatedData = [];
    
    for (let i = 0; i < limit; i++) {
        const index = (startIndex + i) % curatedVideos.length;
        paginatedData.push({
            ...curatedVideos[index],
            id: `${curatedVideos[index].id}-p${page}-i${i}`, 
            likes: `${Math.floor(Math.random() * 90 + 10)}.${Math.floor(Math.random() * 9)}K`
        });
    }

    // Simulate slight network delay to allow frontend skeletons to render smoothly
    setTimeout(() => {
        res.json({ success: true, data: paginatedData });
    }, 400);
};

const getArtistPlaylist = async (req, res) => {
    try {
        const { artistId } = req.params;
        if (artistId === 'anime') {
            const topAnimeQueries = ["Idol YOASOBI", "Gurenge LiSA", "Unravel TK", "Silhouette KANA-BOON", "Kick Back Kenshi Yonezu", "Kaikai Kitan Eve", "Blue Bird Ikimonogakari", "Cruel Angel's Thesis", "Suzume RADWIMPS", "Specialz King Gnu"];
            const promises = topAnimeQueries.map(q => fetchFromSaavn(`${encodeURIComponent(q)}&limit=3`));
            const resultsArray = await Promise.all(promises);
            let allRawTracks = [];
            resultsArray.forEach(res => { if (Array.isArray(res)) allRawTracks.push(...res); });
            return res.json({ success: true, data: deduplicateTracks(processResults(allRawTracks, req, 'all')) });
        }
        const query = ARTIST_QUERIES[artistId];
        if (!query) return res.status(404).json({ success: false, message: 'Artist not found' });
        let allRawTracks = [];
        for (let page = 1; page <= 4; page++) {
            const rawPage = await fetchFromSaavn(`${encodeURIComponent(query)}&limit=50&page=${page}`);
            if (rawPage.length === 0) break; 
            allRawTracks = allRawTracks.concat(rawPage);
        }
        res.json({ success: true, data: deduplicateTracks(processResults(allRawTracks, req, 'all')) });
    } catch (error) { res.status(500).json({ success: false, message: 'Error loading playlist' }); }
};

const fetchTrending = async (req, res) => {
    try {
        const lang = req.query.lang ? req.query.lang.toLowerCase() : 'all';
        if (lang === 'english') {
            const itunesRes = await axios.get('https://itunes.apple.com/us/rss/topsongs/limit=25/json');
            const processed = await hybridFetch(itunesRes.data.feed.entry, req);
            return res.json({ success: true, data: deduplicateTracks(processed) });
        }
        const trendingQueries = { 'all': 'top+charts+india', 'tamil': 'latest+tamil+hits', 'hindi': 'latest+hindi+hits', 'telugu': 'latest+telugu+hits', 'malayalam': 'latest+malayalam+hits', 'japanese': 'jpop+anime+hits' };
        const queryParam = trendingQueries[lang] || `${lang}+latest+hits`;
        const raw = await fetchFromSaavn(`${queryParam}&limit=50`);
        res.json({ success: true, data: deduplicateTracks(processResults(raw, req, lang)) });
    } catch (error) { res.status(500).json({ success: false, data: [] }); }
};

const searchTracks = async (req, res) => {
    const { q, type, id, lang } = req.query;
    if (!q && !id) return res.json({ success: true, data: [] });
    const targetLang = lang ? lang.toLowerCase() : 'all';
    try {
        if (targetLang === 'english' && !type) {
            const itunesRes = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=25`);
            const processed = await hybridFetch(itunesRes.data.results, req);
            return res.json({ success: true, data: deduplicateTracks(processed) });
        }
        if (type === 'albums') {
            const promises = ['https://saavn.sumit.co/api/search/albums', 'https://saavn.dev/api/search/albums'].map(proxy => 
                axios.get(`${proxy}?query=${encodeURIComponent(q)}`, { timeout: 4500 }).then(res => res.data?.data?.results || res.data?.results || [])
            );
            try {
                const results = await Promise.any(promises);
                const formatted = results.map(a => ({ id: a.id, title: a.name || a.title, artist: a.language || 'Official Soundtrack', cover: getHighQualityImage(a), isAlbum: true, language: a.language }));
                const filteredAlbums = formatted.filter(a => targetLang === 'all' || targetLang === 'japanese' || !a.language || String(a.language).toLowerCase() === targetLang);
                if(filteredAlbums.length > 0) return res.json({ success: true, data: filteredAlbums });
            } catch(e) {}
            return res.json({ success: true, data: [] });
        }
        if (type === 'albumDetails') {
            const promises = ['https://saavn.sumit.co/api/albums?id=', 'https://saavn.dev/api/albums?id='].map(proxy => 
                axios.get(`${proxy}${id}`, { timeout: 4500 }).then(res => res.data?.data?.songs || res.data?.songs || [])
            );
            try {
                const songs = await Promise.any(promises);
                if(songs.length > 0) return res.json({ success: true, data: deduplicateTracks(processResults(songs, req, 'all')) });
            } catch (e) {}
            return res.json({ success: true, data: [] });
        }
        
        const raw = await fetchFromSaavn(`${encodeURIComponent(q)}&limit=100`);
        res.json({ success: true, data: deduplicateTracks(processResults(raw, req, targetLang)) });
    } catch (error) { res.status(500).json({ success: false, data: [] }); }
};

const streamTrack = async (req, res) => {
    try {
        const { url } = req.query;
        const headers = req.headers.range ? { Range: req.headers.range } : {};
        const response = await axios({ method: 'GET', url, responseType: 'stream', headers, validateStatus: status => status < 400 });
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', response.headers['content-type'] || 'audio/mpeg');
        res.setHeader('Accept-Ranges', 'bytes');
        if (response.headers['content-length']) res.setHeader('Content-Length', response.headers['content-length']);
        if (response.headers['content-range']) res.setHeader('Content-Range', response.headers['content-range']);
        if (response.status === 206) res.status(206);
        response.data.pipe(res);
    } catch (err) { res.status(500).send('Stream failed'); }
};

const downloadTrack = async (req, res) => {
    try {
        const { url, title } = req.query;
        const response = await axios({ method: 'GET', url, responseType: 'stream' });
        const safeTitle = (title || 'song').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');
        response.data.pipe(res);
    } catch (err) { res.status(500).send('Download failed'); }
};

// EXPORT THE NEW ROUTE
module.exports = { fetchTrending, searchTracks, downloadTrack, streamTrack, getArtistPlaylist, getStatusVideos };
