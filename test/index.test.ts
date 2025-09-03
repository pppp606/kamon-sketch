import { hello } from '../src/index';

describe('Hello World', () => {
  test('should return Hello World message', () => {
    expect(hello()).toBe('Hello World');
  });
});