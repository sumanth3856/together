import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Automatically unmount rendered React component trees after each test
afterEach(() => {
  cleanup();
});
