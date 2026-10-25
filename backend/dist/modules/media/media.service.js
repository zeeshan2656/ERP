import { v4 as uuidv4 } from 'uuid';
import { query } from '../../config/database.js';
import { getStorageService } from '../../storage/storage.factory.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { env } from '../../config/env.js';
export class MediaService {
    storage = getStorageService();
    async uploadFile(fileBuffer, originalFilename, mimeType, category = 'uploads', userId) {
        // 1. Validate MIME type
        if (!env.ALLOWED_MIME_LIST.includes(mimeType)) {
            throw new AppError(`File type '${mimeType}' is not permitted. Allowed types: ${env.ALLOWED_MIME_TYPES}`, 400);
        }
        // 2. Block executable file extensions
        const lowerName = originalFilename.toLowerCase();
        const dangerousExtensions = ['.exe', '.sh', '.bat', '.cmd', '.php', '.phtml', '.js', '.mjs', '.vbs', '.py'];
        if (dangerousExtensions.some((ext) => lowerName.endsWith(ext))) {
            throw new AppError('File extension is not permitted for security reasons.', 400);
        }
        // 3. Save via external storage service
        const stored = await this.storage.saveFile(fileBuffer, originalFilename, mimeType, category);
        // 4. Register in database
        const id = uuidv4();
        await query(`INSERT INTO media_files (id, original_filename, stored_filename, relative_path, mime_type, file_size_bytes, storage_driver, uploaded_by_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'local', ?, NOW())`, [
            id,
            stored.originalFilename,
            stored.storedFilename,
            stored.relativePath,
            stored.mimeType,
            stored.sizeBytes,
            userId || null,
        ]);
        return {
            id,
            originalFilename: stored.originalFilename,
            storedFilename: stored.storedFilename,
            relativePath: stored.relativePath,
            url: `/media/${stored.relativePath}`,
            mimeType: stored.mimeType,
            sizeBytes: stored.sizeBytes,
        };
    }
    async getFileByPath(relativePath) {
        const rows = await query('SELECT * FROM media_files WHERE relative_path = ? AND deleted_at IS NULL LIMIT 1', [relativePath]);
        if (!rows || rows.length === 0) {
            // Check if file exists in storage anyway (e.g. seeded assets)
            const exists = await this.storage.exists(relativePath);
            if (!exists) {
                throw new AppError('Media file not found.', 404);
            }
            const stream = await this.storage.getStream(relativePath);
            return { stream, mimeType: 'application/octet-stream' };
        }
        const media = rows[0];
        const stream = await this.storage.getStream(media.relative_path);
        return {
            stream,
            mimeType: media.mime_type,
            sizeBytes: media.file_size_bytes,
            originalFilename: media.original_filename,
        };
    }
}
export const mediaService = new MediaService();
//# sourceMappingURL=media.service.js.map