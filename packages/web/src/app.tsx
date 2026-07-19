import { useEffect, useState } from 'preact/hooks';
import type { ComponentType } from 'preact';

type ViewId = 'concierge' | 'flow' | 'wayfinder';

/**
 * Each view is code-split into its own chunk and fetched on first open, so
 * the initial payload stays minimal.
 */
const VIEW_LOADERS: Record<ViewId, () => Promise<{ default: ComponentType }>> = {
  concierge: () => import('./views/concierge.js'),
  flow: () => import('./views/flow.js'),
  wayfinder: () => import('./views/wayfinder.js'),
};

const NAV: { id: ViewId; label: string; hint: string }[] = [
  { id: 'concierge', label: 'Concierge', hint: 'Ask in any language' },
  { id: 'flow', label: 'Flow board', hint: 'Crowd level of service' },
  { id: 'wayfinder', label: 'Wayfinder', hint: 'Step-free routes' },
];

export function App() {
  const [view, setView] = useState<ViewId>('concierge');
  const [Active, setActive] = useState<ComponentType | null>(null);

  useEffect(() => {
    let current = true;
    VIEW_LOADERS[view]().then((module) => {
      if (current) setActive(() => module.default);
    });
    return () => {
      current = false;
    };
  }, [view]);

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="rail" role="banner">
        <h1 className="brand">
          Matchday
          <small>FIFA 2026 · stadium intelligence</small>
        </h1>
        <nav aria-label="Console sections">
          <ul>
            {NAV.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setView(item.id)}
                  aria-current={view === item.id ? 'page' : undefined}
                  title={item.hint}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <p className="rail-foot">Demo venue · pre-kick-off snapshot</p>
      </header>

      <main id="main" className="content">
        {Active ? (
          <Active />
        ) : (
          <p role="status" className="eyebrow">
            Loading view…
          </p>
        )}
      </main>
    </div>
  );
}
