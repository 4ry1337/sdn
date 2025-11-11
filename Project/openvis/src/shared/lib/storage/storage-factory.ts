import { IStorage } from './types'
import { LocalStorageAdapter } from './local-storage'

class StorageFactory {
  private static instance: IStorage | null = null;

  static get_storage(): IStorage {
    if ( !this.instance ) {
      this.instance = new LocalStorageAdapter( 'openvis' )
    }
    return this.instance
  }

  static set_storage( storage: IStorage ): void {
    this.instance = storage
  }

  static reset(): void {
    this.instance = null
  }
}

export const storage = StorageFactory.get_storage()

export { StorageFactory }
