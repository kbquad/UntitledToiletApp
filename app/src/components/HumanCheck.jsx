import { useRef, useState } from 'react';
import { useCaptchaStore } from '../captchaStore';
import { MIN_THINK_MS } from '../lib/captcha';

// The human check shown above anything that posts publicly. Three signals,
// none of which gets in a real person's way:
//   1. a question generated per attempt, graded in the store,
//   2. a honeypot field that only something filling the DOM blindly will type
//      into,
//   3. the time between the question appearing and the answer arriving.
//
// Once passed it collapses to a single confirmation line and stays passed for
// HUMAN_PASS_MS, so editing a review twice doesn't mean answering twice.
export const HumanCheck = ({ t, note }) => {
  const challenge = useCaptchaStore((s) => s.challenge);
  const passedUntil = useCaptchaStore((s) => s.passedUntil);
  const wrongAnswers = useCaptchaStore((s) => s.wrongAnswers);
  const submitAnswer = useCaptchaStore((s) => s.submitAnswer);
  const rejectSilently = useCaptchaStore((s) => s.rejectSilently);
  const newChallenge = useCaptchaStore((s) => s.newChallenge);

  const [value, setValue] = useState('');
  const [trap, setTrap] = useState('');
  const [message, setMessage] = useState('');
  const shownAt = useRef(Date.now());

  const passed = passedUntil > Date.now();

  const check = () => {
    if (!value.trim()) return;

    if (trap.trim() || Date.now() - shownAt.current < MIN_THINK_MS) {
      rejectSilently();
      setValue('');
      setTrap('');
      shownAt.current = Date.now();
      setMessage('That didn’t go through. Try this question.');
      return;
    }

    if (submitAnswer(value)) {
      setValue('');
      setMessage('');
      return;
    }
    setValue('');
    shownAt.current = Date.now();
    setMessage('Not quite. Here’s another one.');
  };

  const reroll = () => {
    newChallenge();
    setValue('');
    setMessage('');
    shownAt.current = Date.now();
  };

  if (passed) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9, padding: '11px 14px', borderRadius: 14,
        background: t.tagBg, fontSize: 12, color: t.body,
      }}
      >
        <span aria-hidden="true" style={{ color: t.accent, fontSize: 13, fontWeight: 700 }}>✓</span>
        Human check passed — thanks.
      </div>
    );
  }

  return (
    <div style={{
      padding: '14px 15px 15px', borderRadius: 16, background: t.card,
      border: `1px solid ${t.line}`, display: 'flex', flexDirection: 'column', gap: 10,
    }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>Quick check — are you human?</span>
        <button
          type="button"
          onClick={reroll}
          style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 11, fontWeight: 500, color: t.ink }}
        >
          New question
        </button>
      </div>

      <label htmlFor="human-check-answer" style={{ fontSize: 12.5, color: t.body, lineHeight: 1.5 }}>
        {challenge.prompt}
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          id="human-check-answer"
          key={challenge.id}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, 20))}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } }}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Your answer"
          aria-describedby="human-check-message"
          style={{ flex: 1, minWidth: 0, height: 44, padding: '0 14px', borderRadius: 13, border: `1px solid ${t.line2}`, background: t.bg, fontSize: 13, color: t.text, outline: 'none' }}
        />
        <button
          type="button"
          onClick={check}
          disabled={!value.trim()}
          style={{
            flex: 'none', height: 44, padding: '0 18px', borderRadius: 13, border: 0,
            background: value.trim() ? t.ink : t.trackBg, color: value.trim() ? '#FFF4F8' : t.sub,
            fontSize: 12.5, fontWeight: 600, cursor: value.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Check
        </button>
      </div>

      {/* Off-screen rather than display:none — scripts skip what's obviously
          hidden, but happily fill a field they can still measure. */}
      <input
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        name="loo-website"
        placeholder="Leave this empty"
        style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
      />

      <div id="human-check-message" style={{ fontSize: 11, lineHeight: 1.5, color: message ? t.accent : t.sub, minHeight: 16 }}>
        {message || note || 'Everything you post here is public, so we ask this once.'}
      </div>

      {wrongAnswers >= 3 && (
        <div style={{ fontSize: 11, lineHeight: 1.5, color: t.sub }}>
          Stuck? “New question” gives you a different one — any answer in digits or
          words is fine.
        </div>
      )}
    </div>
  );
};
