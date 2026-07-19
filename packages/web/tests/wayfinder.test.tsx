import { render, screen, fireEvent } from '@testing-library/preact';
import { describe, expect, test } from 'vitest';
import Wayfinder from '../src/views/wayfinder.js';
import { expectNoAxeViolations } from './axe.js';

function chooseRoute(from: string, to: string) {
  fireEvent.change(screen.getByLabelText('Start'), { target: { value: from } });
  fireEvent.change(screen.getByLabelText('Destination'), { target: { value: to } });
  fireEvent.click(screen.getByRole('button', { name: /find route/i }));
}

describe('Wayfinder view', () => {
  test('has no axe violations', async () => {
    const { container } = render(<Wayfinder />);
    await expectNoAxeViolations(container);
  });

  test('narrates a step-free route to Stand B via the East Lift', async () => {
    render(<Wayfinder />);
    chooseRoute('p-conc-east', 'p-stand-b');
    expect(await screen.findByText(/continue to east lift/i)).toBeDefined();
    expect(screen.getByText('step-free')).toBeDefined();
  });

  test('reports stairs when the step-free filter is off', async () => {
    render(<Wayfinder />);
    fireEvent.click(screen.getByLabelText(/step-free only/i));
    chooseRoute('p-conc-east', 'p-stand-b');
    expect(await screen.findByText('includes stairs')).toBeDefined();
  });

  test('shows the total distance for a route', async () => {
    render(<Wayfinder />);
    chooseRoute('p-gate-east', 'p-food-east');
    expect(await screen.findByText('150 m')).toBeDefined();
  });
});
