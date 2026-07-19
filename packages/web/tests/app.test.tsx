import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { describe, expect, test } from 'vitest';
import { App } from '../src/app.js';
import { expectNoAxeViolations } from './axe.js';

// Views are lazy chunks, so every assertion on view content awaits.

describe('App shell', () => {
  test('has no axe violations once the default view loads', async () => {
    const { container } = render(<App />);
    await screen.findByRole('heading', { name: 'Concierge' });
    await expectNoAxeViolations(container);
  });

  test('exposes skip link and landmark structure', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /skip to content/i })).toBeDefined();
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getByRole('main')).toBeDefined();
    expect(screen.getByRole('navigation', { name: /console sections/i })).toBeDefined();
  });

  test('opens the Concierge view by default and marks it current', async () => {
    render(<App />);
    await screen.findByRole('heading', { name: 'Concierge' });
    const active = screen.getByRole('button', { name: 'Concierge' });
    expect(active.getAttribute('aria-current')).toBe('page');
  });

  test('switches to the Flow board', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Flow board' }));
    await screen.findByRole('heading', { name: 'Flow board' });
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Flow board' }).getAttribute('aria-current'),
      ).toBe('page'),
    );
  });

  test('switches to the Wayfinder', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Wayfinder' }));
    await screen.findByRole('heading', { name: 'Wayfinder' });
  });
});
