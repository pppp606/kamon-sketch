const DEFAULT_STORAGE_KEY = 'compass.radius'

export class CompassRadiusPersistence {
  private storageKey: string

  constructor(storageKey: string = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey
  }

  saveRadius(radius: number): void {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem(this.storageKey, radius.toString())
      }
    } catch (error) {
      // Gracefully handle localStorage errors (quota exceeded, disabled, etc.)
      // In production, you might want to log this error
      console.warn('Failed to save compass radius to localStorage:', error)
    }
  }

  loadRadius(): number | null {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) {
        return null
      }

      const storedValue = localStorage.getItem(this.storageKey)
      if (storedValue === null) {
        return null
      }

      // Handle empty or whitespace-only strings
      const trimmedValue = storedValue.trim()
      if (trimmedValue === '') {
        return null
      }

      const parsedValue = parseFloat(trimmedValue)
      
      // Check if parsing resulted in a valid number
      if (isNaN(parsedValue)) {
        return null
      }

      return parsedValue
    } catch (error) {
      // Gracefully handle localStorage errors (security restrictions, etc.)
      console.warn('Failed to load compass radius from localStorage:', error)
      return null
    }
  }

  static getDefaultStorageKey(): string {
    return DEFAULT_STORAGE_KEY
  }
}