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

// UPGRADED FORMAT: Added rich metadata (thumbnails, sizes) for the kkonline.in style Grid View
const getStatusVideos = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const curatedVideos = [
        { id: 'v1', url: "https://cdn.coverr.co/videos/coverr-dj-mixing-music-at-a-party-5264/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80", title: "Club DJ Set BGM Status", views: "124K", size: "3.2 MB" },
        { id: 'v2', url: "https://cdn.coverr.co/videos/coverr-neon-lights-in-the-city-4390/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=400&q=80", title: "Neon City Vibes 4K", views: "89K", size: "2.8 MB" },
        { id: 'v3', url: "https://cdn.coverr.co/videos/coverr-a-beautiful-girl-listening-to-music-4089/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80", title: "Lost in Music Sad Status", views: "210K", size: "4.1 MB" },
        { id: 'v4', url: "https://cdn.coverr.co/videos/coverr-driving-through-the-city-at-night-4228/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=400&q=80", title: "Night Drive Lofi Whatsapp", views: "45K", size: "1.9 MB" },
        { id: 'v5', url: "https://cdn.coverr.co/videos/coverr-crowd-at-a-music-festival-5269/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80", title: "Festival Energy Full Screen", views: "330K", size: "5.5 MB" },
        { id: 'v6', url: "https://cdn.coverr.co/videos/coverr-playing-electric-guitar-5249/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&q=80", title: "Electric Guitar Rock BGM", views: "76K", size: "2.1 MB" },
        { id: 'v7', url: "https://cdn.coverr.co/videos/coverr-a-woman-with-neon-lights-4395/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=400&q=80", title: "Neon Portraits Aesthetic", views: "92K", size: "3.0 MB" },
        { id: 'v8', url: "https://cdn.coverr.co/videos/coverr-playing-the-piano-in-a-studio-5244/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&q=80", title: "Studio Piano Melancholy", views: "112K", size: "3.7 MB" },
        { id: 'v9', url: "https://cdn.coverr.co/videos/coverr-dj-playing-music-5265/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=400&q=80", title: "Rave DJ Bass Boosted", views: "504K", size: "4.8 MB" },
        { id: 'v10', url: "https://cdn.coverr.co/videos/coverr-people-dancing-at-a-party-5267/1080p.mp4", thumbnail: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80", title: "Party Vibes Dance Status", views: "201K", size: "3.4 MB" }
    ];

    const startIndex = ((page - 1) * limit) % curatedVideos.length;
    let paginatedData = [];
    for (let i = 0; i < limit; i++) {
        const index = (startIndex + i) % curatedVideos.length;
        paginatedData.push({ ...curatedVideos[index], id: `${curatedVideos[index].id}-p${page}-i${i}` });
    }
    setTimeout(() => res.json({ success: true, data: paginatedData }), 200);
};

// UPGRADED PROXY: Spoofs headers to obliterate CORS and Hotlinking blocks completely.
const streamTrack = async (req, res) => {
    try {
        const { url } = req.query;
        const headers = req.headers.range ? { Range: req.headers.range } : {};
        
        // Stealth Mode: The Node server pretends to be the host website to bypass security walls
        const spoofedHeaders = {
            ...headers,
            'Referer': url.includes('coverr') ? 'https://coverr.co/' : (url.includes('mixkit') ? 'https://mixkit.co/' : 'https://www.jiosaavn.com/'),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        };

        const response = await axios({ method: 'GET', url, responseType: 'stream', headers: spoofedHeaders, validateStatus: status => status < 400 });
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', response.headers['content-type'] || (url.includes('.mp4') ? 'video/mp4' : 'audio/mpeg'));
        res.setHeader('Accept-Ranges', 'bytes');
        if (response.headers['content-length']) res.setHeader('Content-Length', response.headers['content-length']);
        if (response.headers['content-range']) res.setHeader('Content-Range', response.headers['content-range']);
        if (response.status === 206) res.status(206);
        
        response.data.pipe(res);
    } catch (err) { res.status(500).send('Stream failed'); }
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

module.exports = { fetchTrending, searchTracks, downloadTrack, streamTrack, getArtistPlaylist, getStatusVideos };
