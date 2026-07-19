import { useEffect, useState } from 'preact/hooks';
import { loadFlow, type FlowBoard } from '../lib/client.js';
import { gradeClass } from '../lib/grade.js';

/**
 * The LOS ladder is drawn to a fixed scale of 2.5 persons/m² so bars are
 * comparable across zones; ticks mark the Fruin band boundaries.
 */
const SCALE_MAX = 2.5;
const BAND_TICKS = [0.31, 0.43, 0.72, 1.08, 2.17];

const percent = (density: number) => Math.min((density / SCALE_MAX) * 100, 100);

export default function Flow() {
  const [board, setBoard] = useState<FlowBoard | null>(null);

  useEffect(() => {
    let current = true;
    loadFlow().then((data) => {
      if (current) setBoard(data);
    });
    return () => {
      current = false;
    };
  }, []);

  if (!board) {
    return <p role="status">Reading zone telemetry…</p>;
  }

  return (
    <section aria-labelledby="flow-title">
      <p className="eyebrow">Crowd operations</p>
      <h2 id="flow-title">Flow board</h2>

      <div className="scoreboard">
        <div className="panel overall">
          <p className="eyebrow">Venue LOS</p>
          <p className={`grade ${gradeClass(board.overall)}`} aria-hidden="true">
            {board.overall}
          </p>
          <p className="mono grade-caption">grade {board.overall}</p>
        </div>
        <div className="panel actions">
          <p className="eyebrow">Recommended actions</p>
          <ul>
            {board.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel">
        <table className="flow-table">
          <caption>
            Zone density in persons per square metre, graded A (free flow) to F (jammed) on the
            Fruin walkway scale.
          </caption>
          <thead>
            <tr>
              <th scope="col">Zone</th>
              <th scope="col">Occupants</th>
              <th scope="col">Density</th>
              <th scope="col">Ladder</th>
              <th scope="col">Grade</th>
            </tr>
          </thead>
          <tbody>
            {board.zones.map((zone) => (
              <tr key={zone.id}>
                <th scope="row">{zone.name}</th>
                <td className="mono">{zone.occupants}</td>
                <td className="mono">{zone.density.toFixed(2)}</td>
                <td>
                  {/* Visual only: the density value is in the previous cell. */}
                  <div className="los-track" aria-hidden="true">
                    {BAND_TICKS.map((tick) => (
                      <span key={tick} className="los-tick" style={{ left: `${percent(tick)}%` }} />
                    ))}
                    <div
                      className={`los-fill ${gradeClass(zone.grade)}`}
                      style={{ width: `${percent(zone.density)}%` }}
                    />
                  </div>
                </td>
                <td>
                  <span className={`chip ${gradeClass(zone.grade)}`} aria-label={`Grade ${zone.grade}`}>
                    {zone.grade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
