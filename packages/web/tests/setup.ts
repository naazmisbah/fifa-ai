import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/preact';

// jsdom implements no layout; stub the one layout method the app calls.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  cleanup();
});
