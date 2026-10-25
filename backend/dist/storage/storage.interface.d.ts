import { Readable } from 'stream';
export interface StoredFileResult {
    storedFilename: string;
    originalFilename: string;
    relativePath: string;
    mimeType: string;
    sizeBytes: number;
}
export interface IStorageService {
    /**
     * Save uploaded buffer or stream to the persistent storage outside the project directory.
     */
    saveFile(fileBuffer: Buffer, originalFilename: string, mimeType: string, subfolder?: string): Promise<StoredFileResult>;
    /**
     * Get a readable stream to safely stream the file to clients.
     */
    getStream(relativePath: string): Promise<Readable>;
    /**
     * Check if a file exists.
     */
    exists(relativePath: string): Promise<boolean>;
    /**
     * Delete a file from storage.
     */
    deleteFile(relativePath: string): Promise<boolean>;
    /**
     * Get absolute path for local disk storage (internal use).
     */
    getAbsolutePath(relativePath: string): string;
}
