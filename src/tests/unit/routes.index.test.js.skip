const routes = require('../../routes');

describe('Routes Index', () => {
  it('should export routes router', () => {
    expect(routes).toBeDefined();
    expect(typeof routes).toBe('function'); // Express router is a function
  });

  it('should be usable as middleware', () => {
    // Router should be a function that can be used as middleware
    expect(typeof routes).toBe('function');
  });
});

