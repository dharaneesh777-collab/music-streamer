const NodeCache = require('node-cache');
// Cache responses for 1 hour to optimize performance and respect API rate limits
const cache = new NodeCache({ stdTTL: 3600 }); 

const cacheMiddleware = (req, res, next) => {
    const key = req.originalUrl;
    const cachedResponse = cache.get(key);
    if (cachedResponse) {
        return res.json(cachedResponse);
    }
    res.sendResponse = res.json;
    res.json = (body) => {
        cache.set(key, body);
        res.sendResponse(body);
    };
    next();
};

module.exports = cacheMiddleware;
