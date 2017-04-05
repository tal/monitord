declare module 'electron-settings' {
  interface SavingOpts {
    prettyify: boolean,
  }

  class SettingsObserver {
    dispose(): void
  }

  class Settings extends NodeJS.EventEmitter {
    /**
     * Returns a boolean indicating whether the settings object contains the given key path.
     */
    has(keyPath: string): boolean
    set<T>(keyPath: string, value: T, opts?: SavingOpts): this
    setALl<T>(obj: T, opts?: SavingOpts): this
    get<T>(keyPath: string, defaultValue?: T): T | undefined
    getAll<T>(): T | undefined
    delete(keyPath: string, opts?: SavingOpts): this
    deleteAll(opts?: SavingOpts): this

    /**
     * Watches the given key path for changes and calls the given handler
     * if the value changes. To unsubscribe from changes, call `dispose()`
     * on the Observer instance that is returned.
     */
    watch<T>(keyPath: string, handler: (newValue?: T, oldValue?: T) => void): SettingsObserver

    /**
     * Returns the absolute path to where the settings file is or will be stored.
     */
    file(): string
  }

  var settings: Settings

  export = settings
}