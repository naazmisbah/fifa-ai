import { render, screen } from '@testing-library/preact';
import { describe, expect, test } from 'vitest';
import Flow from '../src/views/flow.js';
import { expectNoAxeViolations } from './axe.js';

// With no VITE_API_URL, the board is computed locally from @matchday/core:
// the demo snapshot grades the venue F with Gate South as the worst zone.

describe('Flow board view', () => {
  test('has no axe violations', async () => {
    const { container } = render(<Flow />);
    await screen.findByRole('table');
    await expectNoAxeViolations(container);
  });

  test('shows the overall venue grade on the scoreboard', async () => {
    render(<Flow />);
    expect(await screen.findByText('grade F')).toBeDefined();
  });

  test('recommends redirecting fans away from the jammed gate', async () => {
    render(<Flow />);
    const action = await screen.findByText(/redirect fans from gate south/i);
    expect(action.textContent).toContain('Gate East');
  });

  test('lists every zone as a table row, worst first', async () => {
    render(<Flow />);
    await screen.findByRole('table');
    const rows = screen.getAllByRole('row');
    // 9 zones + header row
    expect(rows).toHaveLength(10);
    expect(rows[1]?.textContent).toContain('Gate South');
  });

  test('pairs every colored grade with its letter', async () => {
    render(<Flow />);
    await screen.findByRole('table');
    expect(screen.getAllByLabelText(/^grade [A-F]$/i).length).toBe(9);
  });
});
