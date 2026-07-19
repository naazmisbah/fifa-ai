import { render, screen, fireEvent } from '@testing-library/preact';
import { describe, expect, test } from 'vitest';
import Concierge from '../src/views/concierge.js';
import { expectNoAxeViolations } from './axe.js';

// With no VITE_API_URL configured (tests and the static demo), answers come
// from the deterministic engine in @matchday/core, tagged "Offline guide".

function ask(text: string) {
  fireEvent.input(screen.getByLabelText(/your question/i), { target: { value: text } });
  fireEvent.submit(screen.getByRole('button', { name: 'Ask' }).closest('form') as HTMLFormElement);
}

describe('Concierge view', () => {
  test('has no axe violations', async () => {
    const { container } = render(<Concierge />);
    await expectNoAxeViolations(container);
  });

  test('greets the fan and disables Ask while empty', () => {
    render(<Concierge />);
    expect(screen.getByText(/ask me anything about the stadium/i)).toBeDefined();
    expect((screen.getByRole('button', { name: 'Ask' }) as HTMLButtonElement).disabled).toBe(true);
  });

  test('answers a question and labels the origin', async () => {
    render(<Concierge />);
    ask('¿Dónde está el baño?');
    expect(await screen.findByText(/accessible restrooms/i)).toBeDefined();
    expect(screen.getByText('Offline guide')).toBeDefined();
    expect(screen.getByText('¿Dónde está el baño?')).toBeDefined();
  });

  test('answers repeated questions with unique message entries', async () => {
    render(<Concierge />);
    ask('where can we eat');
    await screen.findByText(/food halls/i);
    ask('which gate is step-free');
    expect(await screen.findAllByText(/gate/i)).toBeDefined();
  });

  test('ignores whitespace-only questions', () => {
    render(<Concierge />);
    fireEvent.input(screen.getByLabelText(/your question/i), { target: { value: '   ' } });
    expect((screen.getByRole('button', { name: 'Ask' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
