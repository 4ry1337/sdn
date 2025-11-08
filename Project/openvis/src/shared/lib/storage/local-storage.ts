import { IStorage } from './types';

/**
 * LocalStorage adapter implementing IStorage interface
 * Handles JSON serialization, error handling, and key prefixing
 */
export class LocalStorageAdapter implements IStorage {
  private prefix: string;
  private available: boolean = true;

  constructor(prefix: string = 'openvis') {
    this.prefix = prefix;
    this.checkAvailability();
  }

  /**
   * Test if localStorage is available
   * Can fail in private browsing mode or when storage is full
   */
  private checkAvailability(): void {
    try {
      const test = '__storage_test__';
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        this.available = true;
      } else {
        this.available = false;
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
      this.available = false;
    }
  }

  /**
   * Get prefixed key to avoid collisions
   */
  private getKey(key: string): string {
    return `${this.prefix}_${key}`;
  }

  get<T>(key: string): T | null {
    if (!this.available) return null;

    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) return null;

      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`[Storage] Failed to get "${key}":`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (!this.available) return;

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.getKey(key), serialized);
    } catch (error) {
      console.error(`[Storage] Failed to set "${key}":`, error);

      // If quota exceeded, try to clear old data
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('[Storage] Quota exceeded, clearing storage');
        this.clear();
      }
    }
  }

  remove(key: string): void {
    if (!this.available) return;

    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`[Storage] Failed to remove "${key}":`, error);
    }
  }

  clear(): void {
    if (!this.available) return;

    try {
      const keys = this.keys();
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('[Storage] Failed to clear storage:', error);
    }
  }

  has(key: string): boolean {
    if (!this.available) return false;

    try {
      return localStorage.getItem(this.getKey(key)) !== null;
    } catch (error) {
      console.error(`[Storage] Failed to check "${key}":`, error);
      return false;
    }
  }

  keys(): string[] {
    if (!this.available) return [];

    try {
      const allKeys = Object.keys(localStorage);
      const prefixedKeys = allKeys.filter(key => key.startsWith(`${this.prefix}_`));
      return prefixedKeys;
    } catch (error) {
      console.error('[Storage] Failed to get keys:', error);
      return [];
    }
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return this.available;
  }
}
