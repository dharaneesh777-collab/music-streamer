const express = require('express');
const router = express.Router();
const { fetchTrending, searchTracks, downloadTrack, streamTrack, getArtistPlaylist } = require('../controllers/musicController');

router.get('/trending', fetchTrending);
router.get('/search', searchTracks);
router.get('/download', downloadTrack);
router.get('/stream', streamTrack);
router.get('/artist-playlist/:artistId', getArtistPlaylist); // NEW ROUTE

module.exports = router;
