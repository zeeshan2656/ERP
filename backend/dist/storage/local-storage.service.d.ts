import { Readable } from 'stream';
import { IStorageService, StoredFileResult } from './storage.interface.js';
export declare class LocalStorageService implements IStorageService {
    private basePath;
    constructor(customBasePath?: string);
    private ensureBaseDirectory;
    private sanitizeFilename;
    private getSafePath;
    saveFile(fileBuffer: Buffer, originalFilename: string, mimeType: string, subfolder?: string): Promise<StoredFileResult>;
    getStream(relativePath: string): Promise<Readable>;
    exists(relativePath: string): Promise<boolean>;
    deleteFile(relativePath: string): Promise<boolean>;
    getAbsolutePath(relativePath: string): string;
}
