import { IStorage } from './types';
import { LocalStorageAdapter } from './local-storage';

/**
 * Storage Factory - Singleton pattern for easy backend swapping
 *
 * To switch storage backends:
 * 1. Create new adapter implementing IStorage (e.g., RedisStorageAdapter)
 * 2. Change the implementation in getStorage() method
 * 3. Zero changes needed in consuming code!
 *
 * Example Redis swap:
 * ```typescript
 * static getStorage(): IStorage {
 *   if (!this.instance) {
 *     this.instance = new RedisStorageAdapter(process.env.REDIS_URL!, 'openvis');
 *   }
 *   return this.instance;
 * }
 * ```
 */
class StorageFactory {
  private static instance: IStorage | null = null;

  /**
   * Get singleton storage instance
   * Currently configured to use localStorage
   */
  static getStorage(): IStorage {
    if (!this.instance) {
      // Default to localStorage
      // To swap: just change this line to use a different adapter
      this.instance = new LocalStorageAdapter('openvis');
    }
    return this.instance;
  }

  /**
   * Manually set storage instance
   * Useful for testing or runtime swapping
   */
  static setStorage(storage: IStorage): void {
    this.instance = storage;
  }

  /**
   * Reset storage instance
   * Useful for testing
   */
  static reset(): void {
    this.instance = null;
  }
}

/**
 * Singleton storage instance
 * Import and use this throughout the app
 *
 * Example:
 * ```typescript
 * import { storage } from '@/shared/lib/storage';
 *
 * storage.set('key', { some: 'data' });
 * const data = storage.get<MyType>('key');
 * ```
 */
export const storage = StorageFactory.getStorage();

/**
 * Export factory for advanced use cases
 */
export { StorageFactory };
