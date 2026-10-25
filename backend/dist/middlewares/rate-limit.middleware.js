const rateLimitMap = new Map();
export function rateLimiter(maxRequests = 10, windowMs = 60 * 1000) {
    return (req, res, next) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const record = rateLimitMap.get(ip);
        if (!record || now > record.resetAt) {
            rateLimitMap.set(ip, {
                count: 1,
                resetAt: now + windowMs,
            });
            next();
            return;
        }
        if (record.count >= maxRequests) {
            const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
            res.status(429).json({
                success: false,
                message: `Too many attempts. Please try again after ${waitSeconds} seconds.`,
            });
            return;
        }
        record.count += 1;
        next();
    };
}
//# sourceMappingURL=rate-limit.middleware.js.map