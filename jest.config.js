export default {
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/cli.ts'
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
      functions: 70,
      lines: 80,
      statements: 80
    }
  },
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest/presets/default-esm',
      extensionsToTreatAsEsm: ['.ts'],
      testMatch: ['<rootDir>/test/index.test.ts', '<rootDir>/test/compassArc.test.ts', '<rootDir>/test/line.test.ts', '<rootDir>/test/selection.test.ts', '<rootDir>/test/division.test.ts', '<rootDir>/test/fill.test.ts', '<rootDir>/test/history.test.ts'],
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/cli.ts'
      ],
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true
        }]
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      testEnvironment: 'node',
      moduleNameMapper: {
        '^p5$': '<rootDir>/__mocks__/p5.js'
      }
    },
    {
      displayName: 'jsdom',
      preset: 'ts-jest/presets/default-esm',
      extensionsToTreatAsEsm: ['.ts'],
      testMatch: ['<rootDir>/test/draw.test.ts', '<rootDir>/test/compassRadiusState.test.ts', '<rootDir>/test/history.persistence.test.ts', '<rootDir>/test/keyboard.shortcuts.test.ts', '<rootDir>/test/ui.buttons.test.ts'],
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/cli.ts'
      ],
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          useESM: true
        }]
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
      testEnvironment: 'jsdom',
      setupFiles: ['jest-canvas-mock'],
      moduleNameMapper: {
        '^p5$': '<rootDir>/__mocks__/p5.js'
      }
    }
  ]
};