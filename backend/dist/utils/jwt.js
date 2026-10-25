import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export function generateAccessToken(payload) {
    const options = {
        expiresIn: env.JWT_EXPIRES_IN,
    };
    return jwt.sign(payload, env.JWT_SECRET, options);
}
export function generateRefreshToken(payload) {
    const options = {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}
export function verifyAccessToken(token) {
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        return decoded;
    }
    catch {
        return null;
    }
}
export function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
        return decoded;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=jwt.js.map