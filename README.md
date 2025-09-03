# kamon-sketch

[![CI](https://github.com/pppp606/kamon-sketch/actions/workflows/ci.yml/badge.svg)](https://github.com/pppp606/kamon-sketch/actions/workflows/ci.yml)
[![PR Checks](https://github.com/pppp606/kamon-sketch/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/pppp606/kamon-sketch/actions/workflows/pr-checks.yml)

Node.js + TypeScript project for kamon sketch with p5.js drawing capabilities.

## Features

- 🎨 **p5.js Drawing Environment**: HTML/Canvas based drawing with line and circle primitives
- 🧪 **Comprehensive Testing**: Jest + jest-canvas-mock for drawing snapshot tests  
- 🔧 **TypeScript**: Full type safety with custom p5.js interfaces
- 📊 **Test Coverage**: Coverage reporting with configurable thresholds
- 🚀 **CI/CD**: GitHub Actions workflows for continuous integration

## Getting Started

### Prerequisites

- Node.js >= 18
- npm

### Installation

```bash
npm install
```

### Development Scripts

```bash
# Build the project
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for tests
npm run test:watch

# Type checking
npm run typecheck

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Run all CI checks locally
npm run ci
```

## Project Structure

```
src/
  index.ts       # p5.js entry point & drawing functions
test/
  index.test.ts  # Basic functionality tests
  draw.test.ts   # p5.js drawing tests with snapshots
__mocks__/
  p5.js          # p5.js mock for testing
index.html       # Browser template for p5.js rendering
```

## Testing

The project uses a multi-environment Jest setup:

- **Node.js environment**: Basic functionality tests
- **jsdom environment**: Canvas/DOM-based drawing tests

Coverage thresholds:
- Lines: 80%
- Functions: 80%
- Branches: 70%
- Statements: 80%

## CI/CD

GitHub Actions workflows:

- **CI**: Runs on push/PR with Node.js matrix (18, 20, 22)
- **PR Checks**: Validates PRs with detailed coverage reporting

All workflows include:
- TypeScript type checking
- ESLint compliance
- Jest test execution  
- Build verification
- Coverage reporting