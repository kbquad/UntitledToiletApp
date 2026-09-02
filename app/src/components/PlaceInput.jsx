import { useEffect, useRef, useState } from 'react';
import { geocode } from '../lib/routing';

// A text field that turns typing into place suggestions (Nominatim), for the
// route planner's start/destination/via fields. Debounced well past
// Nominatim's ~1 req/sec usage policy, and cancels the in-flight request
// rather than letting a slow answer clobber a later, faster one.
export default function PlaceInput({
  t, value, placeholder, ariaLabel, onSelect, autoFocus,
}) {
  const [text, setText] = useState(value?.label ?? '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => { setText(value?.label ?? ''); }, [value]);
  useEffect(() => () => { clearTimeout(debounceRef.current); abortRef.current?.abort(); }, []);

  const onChange = (e) => {
    const v = e.target.value;
    setText(v);
    setOpen(true);
    setFailed(false);
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    if (v.trim().length < 3) { setResults([]); setSearching(false); return; }
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      setSearching(true);
      try {
        const rows = await geocode(v, { signal: controller.signal });
        setResults(rows);
        setFailed(false);
      } catch (err) {
        if (err?.name !== 'AbortError') { setResults([]); setFailed(true); }
      } finally {
        setSearching(false);
      }
    }, 450);
  };

  const pick = (r) => {
    onSelect(r);
    setText(r.label);
    setOpen(false);
    setResults([]);
  };

  const showPanel = open && (searching || results.length > 0 || failed);

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={text}
        onChange={onChange}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        style={{
          minHeight: 48, width: '100%', borderRadius: 12, border: `1.5px solid ${t.line2}`,
          background: t.bg, padding: '0 14px', fontSize: 15, fontWeight: 700, color: t.text, outline: 'none',
        }}
      />
      {showPanel && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(100% + 6px)', zIndex: 40,
          borderRadius: 14, background: t.card, border: `1px solid ${t.line}`,
          boxShadow: '0 10px 30px rgba(0,0,0,.18)', overflow: 'hidden', maxHeight: 220, overflowY: 'auto',
        }}
        >
          {searching && <div style={{ padding: '11px 14px', fontSize: 12, color: t.sub }}>Searching…</div>}
          {!searching && failed && (
            <div style={{ padding: '11px 14px', fontSize: 12, lineHeight: 1.5, color: t.sub }}>
              Couldn’t reach the place search. Check your connection and try again.
            </div>
          )}
          {!searching && !failed && results.length === 0 && (
            <div style={{ padding: '11px 14px', fontSize: 12, color: t.sub }}>No matches</div>
          )}
          {!searching && results.map((r) => (
            <button
              key={`${r.lat}-${r.lng}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(r)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '11px 14px',
                border: 0, borderBottom: `1px solid ${t.line}`, background: 'transparent',
                cursor: 'pointer', fontSize: 12.5, lineHeight: 1.4, color: t.text,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
