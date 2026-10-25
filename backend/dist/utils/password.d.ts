export declare function hashPassword(plainText: string): Promise<string>;
export declare function verifyPassword(plainText: string, hashed: string): Promise<boolean>;
