export declare class MediaService {
    private storage;
    uploadFile(fileBuffer: Buffer, originalFilename: string, mimeType: string, category?: string, userId?: string): Promise<{
        id: string;
        originalFilename: string;
        storedFilename: string;
        relativePath: string;
        url: string;
        mimeType: string;
        sizeBytes: number;
    }>;
    getFileByPath(relativePath: string): Promise<{
        stream: import("stream").Readable;
        mimeType: string;
        sizeBytes?: undefined;
        originalFilename?: undefined;
    } | {
        stream: import("stream").Readable;
        mimeType: string;
        sizeBytes: number;
        originalFilename: string;
    }>;
}
export declare const mediaService: MediaService;
