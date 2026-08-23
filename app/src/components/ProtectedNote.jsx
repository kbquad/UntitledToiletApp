import { isProtected } from '../lib/firebase';

// reCAPTCHA v3 runs invisibly, but Google's terms require either its badge or
// this wording wherever it is used. The badge is hidden by App Check, so the
// wording is what we owe people — and it doubles as telling them why a post
// might be refused.
export const ProtectedNote = ({ t, style }) => {
  if (!isProtected) return null;
  return (
    <div style={{ fontSize: 10.5, lineHeight: 1.5, color: t.sub, textAlign: 'center', ...style }}>
      Protected by reCAPTCHA — the Google{' '}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy Policy</a>
      {' '}and{' '}
      <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms of Service</a>
      {' '}apply.
    </div>
  );
};
