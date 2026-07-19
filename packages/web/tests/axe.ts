import axe from 'axe-core';

/**
 * Assert a rendered container has no axe accessibility violations.
 * `color-contrast` is disabled because jsdom cannot paint; contrast is
 * guaranteed by the documented design tokens in `src/styles.css` instead.
 */
export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  const summary = results.violations
    .map((v) => `[${v.id}] ${v.help} (${v.nodes.length} node(s))`)
    .join('\n');
  if (results.violations.length > 0) {
    throw new Error(`expected no axe violations, found:\n${summary}`);
  }
}
