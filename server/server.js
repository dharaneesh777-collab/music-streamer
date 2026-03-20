const express = require('express');
const cors = require('cors');
const { fetchTrending, searchTracks, streamTrack, downloadTrack, getArtistPlaylist, getStatusVideos } = require('./controllers/musicController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Main API Routes
app.get('/api/trending', fetchTrending);
app.get('/api/search', searchTracks);
app.get('/api/stream', streamTrack);
app.get('/api/download', downloadTrack);
app.get('/api/artist-playlist/:artistId', getArtistPlaylist);

// NEW: Video Status Route
app.get('/api/status', getStatusVideos); 

// Health Check
app.get('/', (req, res) => res.send('Streamer API is running smoothly.'));

app.listen(PORT, () => {
    console.log(`Server is running heavily on port ${PORT}`);
});
