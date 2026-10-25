import { IStorageService } from './storage.interface.js';
import { LocalStorageService } from './local-storage.service.js';

let storageInstance: IStorageService;

export function getStorageService(): IStorageService {
  if (!storageInstance) {
    // Phase 1 uses LocalStorageService with external volume mount
    // Future phases can instantiate S3StorageService or R2StorageService here
    storageInstance = new LocalStorageService();
  }
  return storageInstance;
}
