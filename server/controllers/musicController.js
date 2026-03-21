const axios = require('axios');

// IN-MEMORY CACHE
const cache = { trending: {}, search: {} };
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// THE PROVEN PROXY POOL
const SAAVN_PROXIES = [
    'https://saavn.dev/api/search/songs',
    'https://jiosaavn-api-privatecvc2.vercel.app/search/songs',
    'https://jiosaavn-api-sigma-sandy.vercel.app/api/search/songs',
    'https://saavn.sumit.co/api/search/songs'
];

const ARTIST_QUERIES = { 'ar_rahman': 'A.R. Rahman', 'anirudh': 'Anirudh Ravichander', 'ilaiyaraaja': 'Ilaiyaraaja', 'yuvan': 'Yuvan Shankar Raja', 'harris_jayaraj': 'Harris Jayaraj' };

const getFullLengthAudio = (track) => {
    const downloadUrls = track.downloadUrl || track.download_url || track.media_urls || track.urls;
    if (Array.isArray(downloadUrls) && downloadUrls.length > 0) {
        const hq = downloadUrls.find(u => u.quality === '320kbps') || downloadUrls.find(u => u.quality === '160kbps') || downloadUrls[downloadUrls.length - 1];
        return hq.url || hq.link || hq;
    }
    const directUrl = track.media_url || track.url || track.downloadUrl || track.vlink;
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
        if (!seenNames.has(cleanName)) {
            seenNames.add(cleanName);
            uniqueTracks.push(track);
        }
    });
    return uniqueTracks;
};

const fetchFromSaavn = async (query) => {
    // CRITICAL FIX: 6000ms timeout explicitly allows Vercel cold-start proxies to wake up without failing
    const promises = SAAVN_PROXIES.map(proxy => 
        axios.get(`${proxy}?query=${encodeURIComponent(query)}&limit=40`, { timeout: 6000 })
            .then(res => {
                // HYPER-RESILIENT EXTRACTION: Survives unannounced API structure changes
                const data = res.data?.data?.results || res.data?.results || res.data?.data || res.data;
                if (Array.isArray(data) && data.length > 0) return data;
                throw new Error("Invalid or empty payload");
            })
    );
    try { 
        return await Promise.any(promises); 
    } catch (err) { 
        console.error("Proxy race failed for query:", query);
        return []; 
    }
};

const processResults = (rawTracks, req, targetLang = 'all') => {
    if (!rawTracks || !Array.isArray(rawTracks)) return [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    return rawTracks.map(track => {
        const trackLang = String(track.language || track.more_info?.language || "").toLowerCase();
        
        if (targetLang !== 'all' && targetLang !== 'japanese' && trackLang) {
            if (!trackLang.includes(targetLang)) return null; 
        }

        const originalUrl = getFullLengthAudio(track);
        return {
            id: track.id || Math.random().toString(),
            title: track.name || track.title || 'Unknown Title', 
            artist: track.artists?.primary?.[0]?.name || track.primaryArtists || 'Unknown Artist',
            cover: getHighQualityImage(track), 
            audioUrl: originalUrl ? `${baseUrl}/api/stream?url=${encodeURIComponent(originalUrl)}` : null, 
            duration: track.duration || 180, 
            tag: (track.name || track.title || "").toLowerCase().includes('remix') ? 'Remix' : 'Original'
        };
    }).filter(track => track !== null && track.audioUrl);
};

const fetchTrending = async (req, res) => {
    try {
        const lang = req.query.lang ? req.query.lang.toLowerCase() : 'all';
        
        if (cache.trending[lang] && (Date.now() - cache.trending[lang].timestamp < CACHE_TTL)) {
            return res.json({ success: true, data: cache.trending[lang].data });
        }

        // CRITICAL FIX: Relaxed query strings. Avoids exact-match title failures on specific proxies.
        const trendingQueries = { 
            'all': 'top hits', 
            'english': 'english top hits', 
            'tamil': 'tamil top hits', 
            'hindi': 'hindi top hits', 
            'telugu': 'telugu top hits', 
            'malayalam': 'malayalam top hits', 
            'japanese': 'jpop anime hits' 
        };
        const queryParam = trendingQueries[lang] || `${lang} top hits`;
        const rawData = await fetchFromSaavn(queryParam);
        
        const processedData = deduplicateTracks(processResults(rawData, req, lang));

        if (processedData.length === 0) {
            if (cache.trending[lang]) return res.json({ success: true, data: cache.trending[lang].data });
            return res.json({ success: true, data: [] });
        }

        cache.trending[lang] = { timestamp: Date.now(), data: processedData };
        res.json({ success: true, data: processedData });

    } catch (error) { 
        res.status(500).json({ success: false, data: [] }); 
    }
};

const getArtistPlaylist = async (req, res) => {
    try {
        const { artistId } = req.params;
        const query = ARTIST_QUERIES[artistId] || artistId;
        const data = await fetchFromSaavn(query);
        res.json({ success: true, data: deduplicateTracks(processResults(data, req, 'all')) });
    } catch (error) { res.status(500).json({ success: false, message: 'Error loading playlist' }); }
};

const searchTracks = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    try {
        const data = await fetchFromSaavn(q);
        res.json({ success: true, data: deduplicateTracks(processResults(data, req, 'all')) });
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
