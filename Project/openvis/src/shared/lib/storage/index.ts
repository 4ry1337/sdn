/**
 * Storage Infrastructure Layer
 *
 * Provides a clean abstraction for storage backends.
 * Easy to swap between localStorage, Redis, IndexedDB, etc.
 *
 * Usage:
 * ```typescript
 * import { storage } from '@/shared/lib/storage';
 *
 * // Save data
 * storage.set('controllers', controllersArray);
 *
 * // Load data
 * const controllers = storage.get<ControllerType[]>('controllers');
 * ```
 */

export * from './types';
export { LocalStorageAdapter } from './local-storage';
export { storage, StorageFactory } from './storage-factory';
