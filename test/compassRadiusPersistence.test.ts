import { CompassRadiusPersistence } from '../src/compassRadiusPersistence'

describe('CompassRadiusPersistence', () => {
  let storage: Record<string, string>
  let mockLocalStorage: Storage

  beforeEach(() => {
    // Mock localStorage
    storage = {}
    mockLocalStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => { storage[key] = value },
      removeItem: (key: string) => { delete storage[key] },
      clear: () => { storage = {} },
      key: (index: number) => Object.keys(storage)[index] || null,
      length: Object.keys(storage).length
    }
    
    // Replace global localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
  })

  afterEach(() => {
    storage = {}
  })

  describe('save and load radius', () => {
    it('should save radius to localStorage', () => {
      const persistence = new CompassRadiusPersistence()
      persistence.saveRadius(25.5)
      expect(storage['compass.radius']).toBe('25.5')
    })

    it('should load radius from localStorage', () => {
      storage['compass.radius'] = '30.7'
      const persistence = new CompassRadiusPersistence()
      const radius = persistence.loadRadius()
      expect(radius).toBe(30.7)
    })

    it('should return null when no radius is stored', () => {
      const persistence = new CompassRadiusPersistence()
      const radius = persistence.loadRadius()
      expect(radius).toBeNull()
    })

    it('should return null when stored radius is invalid', () => {
      storage['compass.radius'] = 'invalid'
      const persistence = new CompassRadiusPersistence()
      const radius = persistence.loadRadius()
      expect(radius).toBeNull()
    })

    it('should handle negative stored radius', () => {
      storage['compass.radius'] = '-5'
      const persistence = new CompassRadiusPersistence()
      const radius = persistence.loadRadius()
      expect(radius).toBe(-5) // No clamping at persistence layer
    })

    it('should handle zero stored radius', () => {
      storage['compass.radius'] = '0'
      const persistence = new CompassRadiusPersistence()
      const radius = persistence.loadRadius()
      expect(radius).toBe(0)
    })

    it('should handle large stored radius', () => {
      storage['compass.radius'] = '50000'
      const persistence = new CompassRadiusPersistence()
      const radius = persistence.loadRadius()
      expect(radius).toBe(50000)
    })

    it('should handle floating point precision', () => {
      const persistence = new CompassRadiusPersistence()
      persistence.saveRadius(123.456789)
      const radius = persistence.loadRadius()
      expect(radius).toBe(123.456789)
    })
  })

  describe('error handling', () => {
    let originalConsoleWarn: typeof console.warn

    beforeEach(() => {
      // Suppress console.warn during error handling tests
      originalConsoleWarn = console.warn
      console.warn = jest.fn()
    })

    afterEach(() => {
      // Restore console.warn
      console.warn = originalConsoleWarn
    })

    it('should handle localStorage errors gracefully when saving', () => {
      // Mock setItem to throw an error
      mockLocalStorage.setItem = () => {
        throw new Error('QuotaExceededError')
      }

      const persistence = new CompassRadiusPersistence()
      expect(() => persistence.saveRadius(25)).not.toThrow()
    })

    it('should handle localStorage errors gracefully when loading', () => {
      // Mock getItem to throw an error
      mockLocalStorage.getItem = () => {
        throw new Error('SecurityError')
      }

      const persistence = new CompassRadiusPersistence()
      const radius = persistence.loadRadius()
      expect(radius).toBeNull()
    })
  })

  describe('custom storage key', () => {
    it('should use custom storage key when provided', () => {
      const customKey = 'myapp.compass.radius'
      const persistence = new CompassRadiusPersistence(customKey)
      persistence.saveRadius(42)
      expect(storage[customKey]).toBe('42')
      expect(storage['compass.radius']).toBeUndefined()
    })

    it('should load from custom storage key', () => {
      const customKey = 'myapp.compass.radius'
      storage[customKey] = '55.5'
      const persistence = new CompassRadiusPersistence(customKey)
      const radius = persistence.loadRadius()
      expect(radius).toBe(55.5)
    })
  })

  describe('integration scenarios', () => {
    it('should handle repeated save and load operations', () => {
      const persistence = new CompassRadiusPersistence()
      
      persistence.saveRadius(10)
      expect(persistence.loadRadius()).toBe(10)
      
      persistence.saveRadius(20.5)
      expect(persistence.loadRadius()).toBe(20.5)
      
      persistence.saveRadius(0)
      expect(persistence.loadRadius()).toBe(0)
    })

    it('should handle persistence across multiple instances', () => {
      const persistence1 = new CompassRadiusPersistence()
      const persistence2 = new CompassRadiusPersistence()
      
      persistence1.saveRadius(75)
      expect(persistence2.loadRadius()).toBe(75)
    })
  })

  describe('edge cases', () => {
    it('should handle empty string in localStorage', () => {
      storage['compass.radius'] = ''
      const persistence = new CompassRadiusPersistence()
      const radius = persistence.loadRadius()
      expect(radius).toBeNull()
    })

    it('should handle whitespace-only string in localStorage', () => {
      storage['compass.radius'] = '   '
      const persistence = new CompassRadiusPersistence()
      const radius = persistence.loadRadius()
      expect(radius).toBeNull()
    })

    it('should handle scientific notation', () => {
      storage['compass.radius'] = '1e2'
      const persistence = new CompassRadiusPersistence()
      const radius = persistence.loadRadius()
      expect(radius).toBe(100)
    })

    it('should handle very small decimal numbers', () => {
      const persistence = new CompassRadiusPersistence()
      persistence.saveRadius(0.001)
      const radius = persistence.loadRadius()
      expect(radius).toBe(0.001)
    })
  })

  describe('environment compatibility', () => {
    let originalConsoleWarn: typeof console.warn
    let originalLocalStorage: Storage

    beforeEach(() => {
      // Suppress console.warn during these tests
      originalConsoleWarn = console.warn
      console.warn = jest.fn()
      
      // Save original localStorage
      originalLocalStorage = window.localStorage
    })

    afterEach(() => {
      // Restore console.warn and localStorage
      console.warn = originalConsoleWarn
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true
      })
    })

    it('should handle missing localStorage gracefully', () => {
      // Simulate environment without localStorage
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true
      })

      const persistence = new CompassRadiusPersistence()
      expect(() => persistence.saveRadius(25)).not.toThrow()
      expect(persistence.loadRadius()).toBeNull()
    })

    it('should handle localStorage being disabled', () => {
      // Create a new persistence instance first to avoid triggering the getter during setup
      const persistence = new CompassRadiusPersistence()
      
      // Mock localStorage that throws on access
      Object.defineProperty(window, 'localStorage', {
        get: () => {
          throw new Error('localStorage is disabled')
        },
        configurable: true
      })

      expect(() => persistence.saveRadius(25)).not.toThrow()
      expect(persistence.loadRadius()).toBeNull()
    })
  })
})