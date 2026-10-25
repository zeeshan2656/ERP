import { LocalStorageService } from './local-storage.service.js';
let storageInstance;
export function getStorageService() {
    if (!storageInstance) {
        // Phase 1 uses LocalStorageService with external volume mount
        // Future phases can instantiate S3StorageService or R2StorageService here
        storageInstance = new LocalStorageService();
    }
    return storageInstance;
}
//# sourceMappingURL=storage.factory.js.map