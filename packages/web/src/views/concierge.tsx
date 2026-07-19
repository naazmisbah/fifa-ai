import { useEffect, useRef, useState } from 'preact/hooks';
import { askConcierge } from '../lib/client.js';

interface Message {
  id: string;
  role: 'fan' | 'guide';
  text: string;
  origin?: 'gemini' | 'heuristic';
}

const ORIGIN_LABEL = { gemini: 'Gemini', heuristic: 'Offline guide' } as const;

const WELCOME: Message = {
  id: 'welcome',
  role: 'guide',
  text: 'Ask me anything about the stadium — gates, food, seats, step-free routes — in your own language.',
};

export default function Concierge() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (event: Event) => {
    event.preventDefault();
    const query = draft.trim();
    if (!query || busy) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'fan', text: query }]);
    setDraft('');
    setBusy(true);
    const answer = await askConcierge(query, navigator.language);
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'guide', text: answer.text, origin: answer.origin },
    ]);
    setBusy(false);
  };

  return (
    <section aria-labelledby="concierge-title">
      <p className="eyebrow">Fan services</p>
      <h2 id="concierge-title">Concierge</h2>

      <div className="panel thread" role="log" aria-live="polite">
        {messages.map((message) => (
          <p key={message.id} className={`msg ${message.role}`}>
            <span className="sr-only">{message.role === 'fan' ? 'You:' : 'Concierge:'}</span>
            {message.text}
            {message.origin && <span className="origin">{ORIGIN_LABEL[message.origin]}</span>}
          </p>
        ))}
        {busy && <p role="status">Thinking…</p>}
        <div ref={endRef} />
      </div>

      <form className="ask-form" onSubmit={send}>
        <label htmlFor="ask" className="sr-only">
          Your question
        </label>
        <input
          id="ask"
          type="text"
          value={draft}
          onInput={(event) => setDraft((event.target as HTMLInputElement).value)}
          placeholder="¿Dónde está la puerta norte?"
          autoComplete="off"
        />
        <button type="submit" className="action" disabled={!draft.trim() || busy}>
          Ask
        </button>
      </form>
    </section>
  );
}
