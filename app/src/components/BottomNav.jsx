import { useLocation, useNavigate } from 'react-router-dom';
import { NavIcons } from './Icons';

const TABS = [
  { key: 'home', path: '/', label: 'Home', Icon: NavIcons.home },
  { key: 'map', path: '/map', label: 'Map', Icon: NavIcons.map },
  { key: 'list', path: '/list', label: 'Nearby', Icon: NavIcons.list },
  { key: 'saved', path: '/saved', label: 'Saved', Icon: NavIcons.saved },
  { key: 'profile', path: '/profile', label: 'You', Icon: NavIcons.profile },
];

export const BottomNav = ({ t }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', background: t.card,
      borderTop: `1px solid ${t.line}`, padding: '7px 4px 9px',
      paddingBottom: 'calc(9px + env(safe-area-inset-bottom, 0px))',
      boxShadow: '0 -6px 22px rgba(0,0,0,.1)', zIndex: 1100,
    }}
    >
      {TABS.map(({ key, path, label, Icon }) => {
        const active = location.pathname === path;
        const color = active ? t.ink : t.sub;
        return (
          <button
            key={key}
            type="button"
            onClick={() => navigate(path)}
            style={{
              flex: 1, border: 0, background: 'transparent', cursor: 'pointer', display: 'flex',
              flexDirection: 'column', alignItems: 'center', gap: 4, padding: '5px 0', color,
            }}
          >
            <Icon color={color} />
            <span style={{ fontSize: 10, fontWeight: 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
};
