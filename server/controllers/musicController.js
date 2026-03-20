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

// CRITICAL FIX: The Language Enforcer
const processResults = (results, req, targetLang = 'all') => {
    if (!results || !Array.isArray(results)) return [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    return results.map(track => {
        const trackLang = String(track.language || (track.more_info && track.more_info.language) || "").toLowerCase();
        
        // STRICT ENFORCEMENT: If the user clicks "English", the track MUST be officially tagged as "english" in the database.
        // This mathematically eliminates Hindi songs from bleeding into the English tab.
        if (targetLang !== 'all' && targetLang !== 'japanese') {
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
        
        // CRITICAL FIX: Removed the buggy iTunes hybrid engine. 
        // We now fetch purely native English hits from Saavn and filter them aggressively.
        if (lang === 'english') {
            const raw = await fetchFromSaavn(`english+hit+songs&limit=50`);
            return res.json({ success: true, data: deduplicateTracks(processResults(raw, req, 'english')) });
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

const getStatusVideos = async (req, res) => { res.json({success:false}); }; // Fully deprecated for frontend YouTube bypass

module.exports = { fetchTrending, searchTracks, downloadTrack, streamTrack, getArtistPlaylist, getStatusVideos };
