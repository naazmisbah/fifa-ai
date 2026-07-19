import { useState } from 'preact/hooks';
import { loadRoute, WAY_POINTS, type RouteResult } from '../lib/client.js';

const select = (setter: (value: string) => void) => (event: Event) =>
  setter((event.target as HTMLSelectElement).value);

export default function Wayfinder() {
  const [from, setFrom] = useState('p-gate-north');
  const [to, setTo] = useState('p-stand-b');
  const [stepFree, setStepFree] = useState(true);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [noRoute, setNoRoute] = useState(false);
  const [busy, setBusy] = useState(false);

  const find = async (event: Event) => {
    event.preventDefault();
    setBusy(true);
    const result = await loadRoute(from, to, stepFree);
    setRoute(result ?? null);
    setNoRoute(result === undefined);
    setBusy(false);
  };

  return (
    <section aria-labelledby="wayfinder-title">
      <p className="eyebrow">Navigation</p>
      <h2 id="wayfinder-title">Wayfinder</h2>

      <form className="way-form panel" onSubmit={find}>
        <div className="field">
          <label htmlFor="from">Start</label>
          <select id="from" value={from} onChange={select(setFrom)}>
            {WAY_POINTS.map((point) => (
              <option key={point.id} value={point.id}>
                {point.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="to">Destination</label>
          <select id="to" value={to} onChange={select(setTo)}>
            {WAY_POINTS.map((point) => (
              <option key={point.id} value={point.id}>
                {point.name}
              </option>
            ))}
          </select>
        </div>
        <div className="row-2">
          <label>
            <input
              type="checkbox"
              checked={stepFree}
              onChange={(event) => setStepFree((event.target as HTMLInputElement).checked)}
            />{' '}
            Step-free only (ramps and lifts)
          </label>
          <button type="submit" className="action" disabled={busy}>
            Find route
          </button>
        </div>
      </form>

      <div aria-live="polite">
        {noRoute && (
          <p className="panel" role="alert">
            No route satisfies those constraints. Clear the step-free filter or pick another
            destination, and a steward at any Information Point can assist.
          </p>
        )}
        {route && (
          <div className="panel">
            <p className="eyebrow">Your route — avoids congested zones</p>
            <ol className="route-steps">
              {route.narration.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="route-meta mono">
              <span>{Math.round(route.totalMeters)} m</span>
              <span>{route.stepFree ? 'step-free' : 'includes stairs'}</span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
