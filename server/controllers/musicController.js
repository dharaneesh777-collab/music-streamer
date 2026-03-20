const axios = require('axios');

// ==========================================
// REGRESSION PREVENTION: MUSIC ENGINE SECURED
// ==========================================
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

const processResults = (results, req, targetLang = 'all') => {
    if (!results || !Array.isArray(results)) return [];
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    return results.map(track => {
        const trackLang = String(track.language || (track.more_info && track.more_info.language) || "").toLowerCase();
        
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

const fetchTrending = async (req, res) => {
    try {
        const lang = req.query.lang ? req.query.lang.toLowerCase() : 'all';
        
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

const getArtistPlaylist = async (req, res) => {
    try {
        const { artistId } = req.params;
        const query = ARTIST_QUERIES[artistId] || artistId;
        const raw = await fetchFromSaavn(`${encodeURIComponent(query)}&limit=50`);
        res.json({ success: true, data: deduplicateTracks(processResults(raw, req, 'all')) });
    } catch (error) { res.status(500).json({ success: false, message: 'Error loading playlist' }); }
};

const searchTracks = async (req, res) => {
    const { q, lang } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    const targetLang = lang ? lang.toLowerCase() : 'all';
    try {
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

// ==========================================
// NEW VIDEO ENGINE: CATEGORIZED & PAGINATED
// ==========================================
const YT_DATABASE = [
    // Lofi Category
    { id: 'y1', ytId: "jfKfPfyJRdk", title: "Lofi Girl Aesthetic Beats", views: "4.2M", category: "lofi" },
    { id: 'y2', ytId: "5yx6BWlEVag", title: "Chill Lofi Study Mix", views: "12M", category: "lofi" },
    { id: 'y3', ytId: "lTRiuFIWV54", title: "Aesthetic Rain Window", views: "5.1M", category: "lofi" },
    { id: 'y4', ytId: "7NOSDKb0HlU", title: "Chillstep Deep Mix", views: "900K", category: "lofi" },
    { id: 'y5', ytId: "9FvvbVI5rYA", title: "Anime Aesthetic Vibes", views: "1.8M", category: "lofi" },
    { id: 'y6', ytId: "1fueZCTYkpA", title: "Midnight Thoughts Lofi", views: "3.4M", category: "lofi" },
    
    // DJ / Bass Category
    { id: 'y7', ytId: "K4DyBUG242c", title: "NCS Cartoon - On & On", views: "510M", category: "dj" },
    { id: 'y8', ytId: "p7ZsBPK656s", title: "Alan Walker - Fade (BGM)", views: "480M", category: "dj" },
    { id: 'y9', ytId: "J2X5mJ3HDYE", title: "Elektronomia - Sky High", views: "190M", category: "dj" },
    { id: 'y10', ytId: "3nQNiWdeH2Q", title: "Bass Boosted Car Music", views: "45M", category: "dj" },
    { id: 'y11', ytId: "ALZHF5UqnU4", title: "Festival Drops Mix", views: "22M", category: "dj" },

    // Neon / Cyberpunk Category
    { id: 'y12', ytId: "1ZYbU82GVz4", title: "Cyberpunk Synthwave Drive", views: "8.5M", category: "neon" },
    { id: 'y13', ytId: "hYvVaQ47O1Y", title: "Neon Night City Drive", views: "3.2M", category: "neon" },
    { id: 'y14', ytId: "8icpNbgNXRM", title: "Tokyo Drift Synthwave", views: "1.1M", category: "neon" },
    { id: 'y15', ytId: "wY2XkF1v9pI", title: "Retrowave Dashboard", views: "5.6M", category: "neon" },

    // Nature / Cinematic Category
    { id: 'y16', ytId: "vQryFsH_0-Q", title: "Cinematic Forest Drops", views: "2.1M", category: "nature" },
    { id: 'y17', ytId: "6v2L2UGZJAM", title: "Ocean Waves Aesthetic", views: "9.8M", category: "nature" },
    { id: 'y18', ytId: "qRHWXmD5Njc", title: "Mountain Peak Drone", views: "1.4M", category: "nature" }
];

const getStatusVideos = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const category = req.query.category ? req.query.category.toLowerCase() : 'all';
    const limit = 8; // Fetch 8 items per page

    // 1. Relevance-Based Filtering
    let filteredDB = YT_DATABASE;
    if (category !== 'all') {
        filteredDB = YT_DATABASE.filter(v => v.category === category);
    }

    // 2. Pagination Logic
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Check if we exhausted the database for this category
    const hasMore = endIndex < filteredDB.length;
    const paginatedData = filteredDB.slice(startIndex, endIndex);

    // Simulate slight network delay for UI loading state
    setTimeout(() => {
        res.json({ success: true, data: paginatedData, hasMore });
    }, 300);
};

module.exports = { fetchTrending, searchTracks, downloadTrack, streamTrack, getArtistPlaylist, getStatusVideos };
