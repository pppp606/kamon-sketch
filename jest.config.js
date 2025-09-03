export default {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest/presets/default-esm',
      extensionsToTreatAsEsm: ['.ts'],
      testMatch: ['<rootDir>/test/index.test.ts'],
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts'
      ],
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true
        }]
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      testEnvironment: 'node',
      transformIgnorePatterns: [
        'node_modules/(?!(p5)/)'
      ],
      moduleNameMapper: {
        '^p5$': '<rootDir>/__mocks__/p5.js'
      }
    },
    {
      displayName: 'jsdom',
      preset: 'ts-jest/presets/default-esm',
      extensionsToTreatAsEsm: ['.ts'],
      testMatch: ['<rootDir>/test/draw.test.ts'],
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts'
      ],
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true
        }]
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      testEnvironment: 'jsdom',
      setupFiles: ['jest-canvas-mock'],
      transformIgnorePatterns: [
        'node_modules/(?!(p5)/)'
      ],
      moduleNameMapper: {
        '^p5$': '<rootDir>/__mocks__/p5.js'
      }
    }
  ]
};