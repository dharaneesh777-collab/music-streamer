self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
    // This empty fetch listener is explicitly required by Android Chrome 
    // to pass the Progressive Web App (PWA) installation criteria.
    return;
});
