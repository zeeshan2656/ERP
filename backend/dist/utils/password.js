import bcrypt from 'bcryptjs';
const SALT_ROUNDS = 10;
export async function hashPassword(plainText) {
    return bcrypt.hash(plainText, SALT_ROUNDS);
}
export async function verifyPassword(plainText, hashed) {
    return bcrypt.compare(plainText, hashed);
}
//# sourceMappingURL=password.js.map