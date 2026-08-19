export const Chip = ({ label, active, onClick, t, style }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flex: 'none', padding: '8px 13px', borderRadius: 11, fontSize: 12, fontWeight: 500,
      cursor: 'pointer', whiteSpace: 'nowrap',
      background: active ? t.ink : t.card, color: active ? '#FFF4F8' : t.body,
      border: `1px solid ${active ? t.ink : t.line2}`,
      ...style,
    }}
  >
    {label}
  </button>
);

// Purely visual switch track — the enclosing row is the real button, since
// a <button> can't nest inside another interactive element.
export const ToggleTrack = ({ on, t }) => (
  <span
    style={{
      width: 40, height: 23, borderRadius: 12, background: on ? t.ink : t.line2,
      display: 'flex', alignItems: 'center', padding: 2.5, flex: 'none',
      justifyContent: on ? 'flex-end' : 'flex-start',
    }}
  >
    <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,.2)', display: 'block' }} />
  </span>
);

// Standalone interactive toggle, for when nothing else on the row is clickable.
export const Toggle = ({ on, onClick, t }) => (
  <button
    type="button"
    onClick={onClick}
    style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', display: 'flex', flex: 'none' }}
  >
    <ToggleTrack on={on} t={t} />
  </button>
);

// An unrated washroom shows "New" in muted theme colours rather than a score,
// so a place nobody has reviewed never looks like a badly-rated one.
export const ScoreBadge = ({ washroom, t, size = 44 }) => (
  <span style={{
    flex: 'none', width: size, height: size, borderRadius: size * 0.32,
    background: washroom.rated ? washroom.scoreBg : t.tagBg,
    color: washroom.rated ? washroom.scoreFg : t.sub,
    fontSize: washroom.rated ? size * 0.34 : size * 0.24,
    fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}
  >
    {washroom.rated ? washroom.scoreText : 'New'}
  </span>
);

export const IconButton = ({ children, onClick, t, size = 38, style }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: size, height: size, borderRadius: 12, background: t.card, border: `1px solid ${t.line}`,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
      ...style,
    }}
  >
    {children}
  </button>
);

export const PrimaryButton = ({ children, onClick, accent, disabled, style }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      height: 50, borderRadius: 15, border: 0, background: accent, color: '#FFFFFF',
      fontSize: 13.5, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
      ...style,
    }}
  >
    {children}
  </button>
);
