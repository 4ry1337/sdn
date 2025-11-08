/**
 * Storage interface for abstracting storage backends
 * Allows easy swapping between localStorage, Redis, IndexedDB, etc.
 */
export interface IStorage {
  /**
   * Get item from storage
   * @param key - Storage key
   * @returns Parsed value or null if not found or parse error
   */
  get<T>(key: string): T | null;

  /**
   * Set item in storage
   * @param key - Storage key
   * @param value - Value to store (will be serialized to JSON)
   */
  set<T>(key: string, value: T): void;

  /**
   * Remove item from storage
   * @param key - Storage key
   */
  remove(key: string): void;

  /**
   * Clear all items with the configured prefix
   */
  clear(): void;

  /**
   * Check if key exists in storage
   * @param key - Storage key
   */
  has(key: string): boolean;

  /**
   * Get all keys with the configured prefix
   * @returns Array of storage keys
   */
  keys(): string[];
}

/**
 * Supported storage backend types
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'redis' | 'indexedDB' | 'memory';
