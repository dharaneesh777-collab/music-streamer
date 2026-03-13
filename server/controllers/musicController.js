const axios = require('axios');

const ARTIST_QUERIES = { 'ar_rahman': 'A.R. Rahman', 'anirudh': 'Anirudh Ravichander', 'ilaiyaraaja': 'Ilaiyaraaja', 'yuvan': 'Yuvan Shankar Raja', 'harris_jayaraj': 'Harris Jayaraj' };

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

const SAAVN_PROXIES = ['https://saavn.sumit.co/api/search/songs', 'https://saavn.dev/api/search/songs', 'https://jiosaavn-api-sigma-sandy.vercel.app/api/search/songs'];

const fetchFromSaavn = async (query) => {
    for (const proxy of SAAVN_PROXIES) {
        try {
            const res = await axios.get(`${proxy}?query=${query}`, { timeout: 8000 });
            const results = res.data?.data?.results || res.data?.results || (Array.isArray(res.data) ? res.data : []);
            if (results.length > 0) return results;
        } catch (err) { continue; }
    }
    return [];
};

// UPGRADED: The Deep Data Validator & English Purification Rule
const processResults = (results, req, targetLang = 'all') => {
    if (!results || !Array.isArray(results)) return [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    return results.map(track => {
        // Force string conversion to prevent array crash loops
        const trackLang = String(track.language || (track.more_info && track.more_info.language) || "").toLowerCase();
        const artistName = String(track.artists?.primary?.[0]?.name || track.primaryArtists || "").toLowerCase();

        if (targetLang !== 'all' && targetLang !== 'japanese') {
            if (!trackLang || !trackLang.includes(targetLang)) return null;

            // THE PURIFICATION HACK: Destroy Indian artists hiding in English tags
            if (targetLang === 'english') {
                const indianSignatures = ['anirudh', 'brodha v', 'dj bravo', 'guri', 'diljit', 'rahman', 'yuvan', 'harris', 'devi sri', 'thaman', 'sid sriram', 'arijit', 'shreya', 'badshah', 'honey singh', 'neha kakkar', 'pritam', 'vishal'];
                if (indianSignatures.some(sig => artistName.includes(sig))) return null;
            }
        }

        const originalUrl = getFullLengthAudio(track);
        return {
            id: track.id || Math.random().toString(),
            title: track.name || track.title,
            artist: track.artists?.primary?.[0]?.name || track.primaryArtists || 'Unknown Artist',
            cover: getHighQualityImage(track),
            audioUrl: originalUrl ? `${baseUrl}/api/stream?url=${encodeURIComponent(originalUrl)}` : null, 
            duration: track.duration || 180,
            tag: (track.name || track.title || "").toLowerCase().includes('remix') ? 'Remix' : 'Original'
        };
    }).filter(track => track !== null && track.audioUrl);
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

        // UPGRADED: The Global Pop Bypass for pure English charts
        if (lang === 'english') {
            const globalArtists = ["The Weeknd", "Taylor Swift", "Ed Sheeran", "Dua Lipa", "Drake", "Post Malone", "Ariana Grande", "Eminem", "Imagine Dragons", "Bruno Mars"];
            const promises = globalArtists.map(q => fetchFromSaavn(`${encodeURIComponent(q)}+top+hits&limit=4`));
            const resultsArray = await Promise.all(promises);
            let allRawTracks = [];
            resultsArray.forEach(res => { if (Array.isArray(res)) allRawTracks.push(...res); });

            const processed = deduplicateTracks(processResults(allRawTracks, req, 'english')).sort(() => 0.5 - Math.random());
            return res.json({ success: true, data: processed });
        }
        
        const trendingQueries = {
            'all': 'top+charts+india',
            'tamil': 'tamil+top+50',
            'hindi': 'hindi+top+50',
            'telugu': 'telugu+top+50',
            'malayalam': 'malayalam+top+50',
            'japanese': 'jpop+anime+hits'
        };

        const queryParam = trendingQueries[lang] || `${lang}+latest+hits`;
        const raw = await fetchFromSaavn(`${queryParam}&limit=150`);
        
        res.json({ success: true, data: deduplicateTracks(processResults(raw, req, lang)) });
    } catch (error) { res.status(500).json({ success: false, data: [] }); }
};

const searchTracks = async (req, res) => {
    const { q, type, id, lang } = req.query;
    if (!q && !id) return res.json({ success: true, data: [] });

    const targetLang = lang ? lang.toLowerCase() : 'all';

    try {
        if (type === 'albums') {
            for (const proxy of ['https://saavn.sumit.co/api/search/albums', 'https://saavn.dev/api/search/albums']) {
                try {
                    const resProxy = await axios.get(`${proxy}?query=${encodeURIComponent(q)}`);
                    let results = resProxy.data?.data?.results || resProxy.data?.results || [];
                    const formatted = results.map(a => ({ id: a.id, title: a.name || a.title, artist: a.language || 'Official Soundtrack', cover: getHighQualityImage(a), isAlbum: true, language: a.language }));
                    
                    const filteredAlbums = formatted.filter(a => targetLang === 'all' || targetLang === 'japanese' || !a.language || String(a.language).toLowerCase() === targetLang);
                    if(filteredAlbums.length > 0) return res.json({ success: true, data: filteredAlbums });
                } catch(e) {}
            }
            return res.json({ success: true, data: [] });
        }
        if (type === 'albumDetails') {
            for (const proxy of ['https://saavn.sumit.co/api/albums?id=', 'https://saavn.dev/api/albums?id=']) {
                try {
                    const resProxy = await axios.get(`${proxy}${id}`);
                    let songs = resProxy.data?.data?.songs || resProxy.data?.songs || [];
                    if(songs.length > 0) return res.json({ success: true, data: deduplicateTracks(processResults(songs, req, 'all')) });
                } catch(e) {}
            }
            return res.json({ success: true, data: [] });
        }
        
        const raw = await fetchFromSaavn(`${encodeURIComponent(q)}&limit=150`);
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

module.exports = { fetchTrending, searchTracks, downloadTrack, streamTrack, getArtistPlaylist };
