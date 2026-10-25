import { JwtPayload } from 'jsonwebtoken';
export interface TokenPayload {
    userId: string;
    email: string;
    username: string;
    roleId: string;
    roleSlug: string;
}
export declare function generateAccessToken(payload: TokenPayload): string;
export declare function generateRefreshToken(payload: {
    userId: string;
}): string;
export declare function verifyAccessToken(token: string): (JwtPayload & TokenPayload) | null;
export declare function verifyRefreshToken(token: string): (JwtPayload & {
    userId: string;
}) | null;
