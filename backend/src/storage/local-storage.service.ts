import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { IStorageService, StoredFileResult } from './storage.interface.js';

export class LocalStorageService implements IStorageService {
  private basePath: string;

  constructor(customBasePath?: string) {
    this.basePath = customBasePath || env.RESOLVED_MEDIA_PATH;
    this.ensureBaseDirectory();
  }

  private ensureBaseDirectory(): void {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
      logger.info('Created external media storage directory', { path: this.basePath });
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private getSafePath(relativePath: string): string {
    const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolute = path.join(this.basePath, normalized);

    // Security check: Ensure the resulting path resides strictly inside basePath
    if (!absolute.startsWith(this.basePath)) {
      throw new Error('Access denied: Path traversal attempt detected.');
    }

    return absolute;
  }

  async saveFile(
    fileBuffer: Buffer,
    originalFilename: string,
    mimeType: string,
    subfolder = 'uploads'
  ): Promise<StoredFileResult> {
    const ext = path.extname(originalFilename).toLowerCase();
    const sanitizedExt = ext.replace(/[^a-z0-9.]/g, '');
    const uniqueName = `${uuidv4()}${sanitizedExt}`;

    const targetDir = path.join(this.basePath, subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fullPath = path.join(targetDir, uniqueName);
    await fs.promises.writeFile(fullPath, fileBuffer);

    const relativePath = path.posix.join(subfolder, uniqueName);

    logger.info('Saved media file to persistent storage', {
      originalFilename,
      uniqueName,
      relativePath,
      sizeBytes: fileBuffer.length,
    });

    return {
      storedFilename: uniqueName,
      originalFilename: this.sanitizeFilename(originalFilename),
      relativePath,
      mimeType,
      sizeBytes: fileBuffer.length,
    };
  }

  async getStream(relativePath: string): Promise<Readable> {
    const fullPath = this.getSafePath(relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${relativePath}`);
    }
    return fs.createReadStream(fullPath);
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      const fullPath = this.getSafePath(relativePath);
      return fs.existsSync(fullPath);
    } catch {
      return false;
    }
  }

  async deleteFile(relativePath: string): Promise<boolean> {
    try {
      const fullPath = this.getSafePath(relativePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      logger.error('Error deleting file', { error: (err as Error).message });
      return false;
    }
  }

  getAbsolutePath(relativePath: string): string {
    return this.getSafePath(relativePath);
  }
}
