const axios = require('axios');

// IN-MEMORY CACHE: Stores API results for 30 minutes to make loading instant
const cache = {
    trending: {},
    search: {}
};
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

const SAAVN_BASE_URLS = [
    'https://saavn.dev/api',
    'https://jiosaavn-api-privatecvc2.vercel.app/api',
    'https://saavn.sumit.co/api'
];

const ARTIST_QUERIES = { 'ar_rahman': 'A.R. Rahman', 'anirudh': 'Anirudh Ravichander', 'ilaiyaraaja': 'Ilaiyaraaja', 'yuvan': 'Yuvan Shankar Raja', 'harris_jayaraj': 'Harris Jayaraj' };

const fetchFromSaavn = async (endpoint) => {
    const promises = SAAVN_BASE_URLS.map(base => 
        axios.get(`${base}${endpoint}`, { timeout: 5000 })
            .then(res => {
                const data = res.data?.data || res.data;
                if (data && (data.results || data.songs || Array.isArray(data))) return data;
                throw new Error("Invalid payload");
            })
    );
    try { return await Promise.any(promises); } catch (err) { return null; }
};

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
        if (!seenNames.has(cleanName)) {
            seenNames.add(cleanName);
            uniqueTracks.push(track);
        }
    });
    return uniqueTracks;
};

const processResults = (rawTracks, req) => {
    if (!rawTracks || !Array.isArray(rawTracks)) return [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    return rawTracks.map(track => {
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

const fetchTrending = async (req, res) => {
    try {
        const lang = req.query.lang ? req.query.lang.toLowerCase() : 'all';
        
        // CACHE CHECK: If we already fetched this recently, return it instantly (0ms load time)
        if (cache.trending[lang] && (Date.now() - cache.trending[lang].timestamp < CACHE_TTL)) {
            return res.json({ success: true, data: cache.trending[lang].data });
        }

        let data;
        // SINGLE-HOP FETCH: Reverted to a single blazing-fast query to eliminate proxy hangups
        if (lang === 'english') {
            data = await fetchFromSaavn(`/search/songs?query=english+top+hits+2024+global&limit=50`);
        } else {
            const trendingQueries = { 'all': 'top+charts+india', 'tamil': 'latest+tamil+hits', 'hindi': 'latest+hindi+hits', 'telugu': 'latest+telugu+hits', 'malayalam': 'latest+malayalam+hits', 'japanese': 'jpop+anime+hits' };
            const queryParam = trendingQueries[lang] || `${lang}+latest+hits`;
            data = await fetchFromSaavn(`/search/songs?query=${queryParam}&limit=50`);
        }

        const processedData = deduplicateTracks(processResults(data?.results || [], req));
        
        // CACHE SAVE: Store the result in RAM for the next 30 minutes
        if (processedData.length > 0) {
            cache.trending[lang] = { timestamp: Date.now(), data: processedData };
        }

        res.json({ success: true, data: processedData });
    } catch (error) { res.status(500).json({ success: false, data: [] }); }
};

const getArtistPlaylist = async (req, res) => {
    try {
        const { artistId } = req.params;
        const query = ARTIST_QUERIES[artistId] || artistId;
        const data = await fetchFromSaavn(`/search/songs?query=${encodeURIComponent(query)}&limit=50`);
        res.json({ success: true, data: deduplicateTracks(processResults(data?.results || [], req)) });
    } catch (error) { res.status(500).json({ success: false, message: 'Error loading playlist' }); }
};

const searchTracks = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    try {
        const data = await fetchFromSaavn(`/search/songs?query=${encodeURIComponent(q)}&limit=100`);
        res.json({ success: true, data: deduplicateTracks(processResults(data?.results || [], req)) });
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
