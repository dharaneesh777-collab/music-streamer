const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { fetchTrending, searchTracks, streamTrack, downloadTrack, getArtistPlaylist } = require('./controllers/musicController');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Pure Music API Routes
app.get('/api/trending', fetchTrending);
app.get('/api/search', searchTracks);
app.get('/api/stream', streamTrack);
app.get('/api/download', downloadTrack);
app.get('/api/artist-playlist/:artistId', getArtistPlaylist);

app.get('/', (req, res) => res.send('Music Streamer API is running smoothly.'));

// ==========================================
// THE HEARTBEAT ENGINE (Keep-Alive)
// ==========================================
const PROXY_URLS = [
    'https://saavn.dev/api/search/songs?query=a&limit=1',
    'https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=a&limit=1',
    'https://jiosaavn-api-sigma-sandy.vercel.app/api/search/songs?query=a&limit=1',
    'https://saavn.sumit.co/api/search/songs?query=a&limit=1'
];

const startHeartbeat = () => {
    const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes

    setInterval(async () => {
        console.log(`[${new Date().toISOString()}] 💓 Executing Heartbeat Ping to keep proxies warm...`);
        try {
            // Promise.allSettled ensures that if one proxy fails, the others still get pinged
            await Promise.allSettled(
                PROXY_URLS.map(url => axios.get(url, { timeout: 3000 }))
            );
            console.log(`[${new Date().toISOString()}] 💓 Heartbeat successful. Proxy containers are awake.`);
        } catch (error) {
            console.error("Heartbeat encountered an anomaly, but loop will continue.");
        }
    }, PING_INTERVAL);
};

app.listen(PORT, () => {
    console.log(`Server is running heavily on port ${PORT}`);
    startHeartbeat(); // Ignite the engine when the server starts
});
