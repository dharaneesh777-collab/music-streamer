export const getPlaylists = () => JSON.parse(localStorage.getItem('localPlaylists')) || {};

export const createPlaylist = (name) => {
    const playlists = getPlaylists();
    if (!playlists[name]) {
        playlists[name] = [];
        localStorage.setItem('localPlaylists', JSON.stringify(playlists));
    }
};

export const addTrackToPlaylist = (playlistName, track) => {
    const playlists = getPlaylists();
    if (playlists[playlistName] && !playlists[playlistName].find(t => t.id === track.id)) {
        playlists[playlistName].push(track);
        localStorage.setItem('localPlaylists', JSON.stringify(playlists));
    }
};
