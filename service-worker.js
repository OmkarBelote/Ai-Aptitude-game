const CACHE_NAME = 'aptitude-game-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/game-modes.html',
    '/quiz-interface.html',
    '/results.html',
    '/assets/css/main.css',
    '/assets/css/game.css',
    '/assets/css/components.css',
    '/assets/js/config.js',
    '/assets/js/storage-manager.js',
    '/assets/js/question-manager.js',
    '/assets/js/scoring-system.js',
    '/assets/js/question-renderer.js',
    '/assets/js/game-engine.js',
    '/data/logical-reasoning.json',
    '/data/mathematics.json',
    '/data/quantitative-aptitude.json',
    '/data/technical-aptitude.json',
    '/data/verbal-ability.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});