import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { useDataStore } from '../dataStore';
import { useToastStore } from '../toastStore';
import { useWashroom, useReviews } from '../hooks/useWashroomData';
import { REVIEW_TAGS } from '../data/locations';
import { IconBack } from '../components/Icons';
import { Chip } from '../components/ui';
import { Loading } from '../components/Status';

const WORDS = ['', 'Grim', 'Rough', 'Okay', 'Clean', 'Spotless'];

export default function ReviewScreen({ t }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const flash = useToastStore((s) => s.flash);
  const submitReview = useDataStore((s) => s.submitReview);
  const displayName = useStore((s) => s.displayName);
  const setDisplayName = useStore((s) => s.setDisplayName);

  const cur = useWashroom(id);
  const { reviews, loading } = useReviews(id);
  const mine = reviews.find((r) => r.isMine);

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [pickedTags, setPickedTags] = useState([]);
  const [anon, setAnon] = useState(!displayName);
  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Editing an existing review starts from what you wrote last time.
  useEffect(() => {
    if (loading || loaded) return;
    if (mine) {
      setRating(mine.rating);
      setText(mine.body);
      setAnon(mine.authorName === 'A local');
    }
    setLoaded(true);
  }, [loading, loaded, mine]);

  if (!cur || loading) return <div className="screen" style={{ background: t.bg }}><Loading t={t} /></div>;

  const toggleTag = (tag) => setPickedTags((p) => (p.includes(tag) ? p.filter((x) => x !== tag) : [...p, tag]));

  const submit = async () => {
    if (rating === 0 || saving) return;
    setSaving(true);
    const tagLine = pickedTags.length ? `${pickedTags.join(' · ')}.` : '';
    const body = [text.trim(), tagLine].filter(Boolean).join(' ');
    const authorName = anon ? 'A local' : (name.trim() || 'A local');

    try {
      if (!anon && name.trim()) setDisplayName(name.trim());
      await submitReview(id, { rating, body, authorName });
      navigate(`/washroom/${id}`, { replace: true });
      flash(mine ? 'Review updated. Thanks!' : 'Thanks — your review is live for everyone.');
    } catch (e) {
      setSaving(false);
      flash(e?.message ?? 'Couldn’t post that review. Try again.');
    }
  };

  return (
    <div className="screen" style={{ background: t.bg }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px 10px', paddingTop: 'calc(16px + var(--safe-t))' }}>
        <button type="button" aria-label="Back" onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, background: t.card, border: `1px solid ${t.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconBack color={t.ink} />
        </button>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-.02em', color: t.text }}>
          {mine ? 'Edit your review' : 'Rate this washroom'}
        </div>
      </div>
      <div className="scroll" style={{ padding: '8px 18px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 13, color: t.sub }}>{cur.name}</div>

        <div style={{ padding: '20px 16px', borderRadius: 20, background: t.card, border: `1px solid ${t.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: t.body }}>How clean was it?</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} star${n === 1 ? '' : 's'}`}
                onClick={() => setRating(n)}
                style={{
                  width: 46, height: 46, borderRadius: 14, cursor: 'pointer', fontSize: 20, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${n <= rating ? t.accent : t.line2}`,
                  background: n <= rating ? t.tagBg : t.bg,
                  color: n <= rating ? t.accent : t.line2,
                }}
              >
                ★
              </button>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: rating ? t.accent : t.sub, minHeight: 19 }}>{WORDS[rating] || 'Tap a star'}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.text, marginBottom: 9 }}>What stood out? (optional)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {REVIEW_TAGS.map((tag) => (
              <Chip key={tag} label={tag} active={pickedTags.includes(tag)} t={t} onClick={() => toggleTag(tag)} />
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>Tell people what it was like</span>
            <span style={{ fontSize: 10.5, color: t.sub }}>{text.length} / 600</span>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 600))}
            placeholder="Stalls were spotless and there was a queue of two. Attendant came through while I was there."
            style={{ width: '100%', minHeight: 132, padding: 14, borderRadius: 16, border: `1px solid ${t.line2}`, background: t.card, fontSize: 12.5, lineHeight: 1.55, color: t.text, resize: 'none', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 15px', borderRadius: 14, background: t.tagBg, cursor: 'pointer' }}>
            <input type="checkbox" checked={anon} onChange={() => setAnon((a) => !a)} style={{ width: 17, height: 17, accentColor: t.accent }} />
            <span style={{ fontSize: 12, color: t.body }}>Post as “A local”</span>
          </label>
          {!anon && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="Name to show, e.g. Mira K."
              style={{ height: 46, padding: '0 14px', borderRadius: 14, border: `1px solid ${t.line2}`, background: t.card, fontSize: 13, color: t.text, outline: 'none' }}
            />
          )}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={rating === 0 || saving}
          style={{
            height: 50, borderRadius: 15, border: 0,
            background: rating === 0 ? t.trackBg : t.accent,
            color: rating === 0 ? t.sub : '#FFFFFF',
            fontSize: 13.5, fontWeight: 600,
            cursor: rating === 0 || saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Posting…' : rating === 0 ? 'Pick a rating to post' : mine ? 'Update review' : 'Post review'}
        </button>

        <div style={{ fontSize: 11, lineHeight: 1.55, color: t.sub, textAlign: 'center' }}>
          Your review is public and helps the next person. You can edit it later.
        </div>
      </div>
    </div>
  );
}
