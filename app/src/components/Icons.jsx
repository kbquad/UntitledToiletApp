// Small inline icon set, ported from the Loo Blush design's SVG paths.

export const IconBack = ({ color = 'currentColor', size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.8"><path d="M11 4 6 9l5 5" /></svg>
);

export const IconHome = ({ color = 'currentColor', size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.7"><path d="M3.4 8.6 10 3.4l6.6 5.2V16a1 1 0 0 1-1 1h-3.2v-4.6H7.6V17H4.4a1 1 0 0 1-1-1Z" /></svg>
);

export const IconGear = ({ color = 'currentColor', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.6"><circle cx="10" cy="10" r="2.8" /><path d="M10 2.2v2M10 15.8v2M2.2 10h2M15.8 10h2M4.6 4.6l1.4 1.4M14 14l1.4 1.4M15.4 4.6 14 6M6 14l-1.4 1.4" /></svg>
);

export const IconSearch = ({ color = 'currentColor', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7"><circle cx="7" cy="7" r="4.6" /><path d="M10.6 10.6 14 14" /></svg>
);

export const IconFilter = ({ color = '#FFF4F8', size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.7"><path d="M2 5h14M4.5 9h9M7 13h4" /></svg>
);

export const IconPlus = ({ color = '#FFFFFF', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.9"><path d="M9 3.6v10.8M3.6 9h10.8" /></svg>
);

export const IconTarget = ({ color = 'currentColor', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.7"><circle cx="9" cy="9" r="3.2" /><path d="M9 1v2.4M9 14.6V17M1 9h2.4M14.6 9H17" /></svg>
);

export const IconBookmark = ({ color = 'currentColor', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.7"><path d="M3.5 2h7v10l-3.5-2.6L3.5 12Z" /></svg>
);

export const IconMap = ({ color = 'currentColor', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke={color} strokeWidth="1.7"><path d="M7 12.5s4.4-4.3 4.4-7A4.4 4.4 0 0 0 2.6 5.5c0 2.7 4.4 7 4.4 7Z" /><circle cx="7" cy="5.4" r="1.4" /></svg>
);

export const IconNavigate = ({ color = 'currentColor', size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.7" strokeLinejoin="round"><path d="M14 2 2 7l5 2 2 5 5-12Z" /></svg>
);

export const IconChevronRight = ({ color = 'currentColor', size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.7"><path d="M7 4l5 5-5 5" /></svg>
);

export const NavIcons = {
  home: ({ color, size = 21 }) => (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="1.7"><path d="M3.6 9.4 11 3.6l7.4 5.8v8.2a1 1 0 0 1-1 1h-3.6v-5.2H8.2v5.2H4.6a1 1 0 0 1-1-1Z" /></svg>
  ),
  map: ({ color, size = 21 }) => (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="1.7"><path d="M11 20s6.6-6.6 6.6-11A6.6 6.6 0 0 0 4.4 9c0 4.4 6.6 11 6.6 11Z" /><circle cx="11" cy="8.8" r="2.2" /></svg>
  ),
  list: ({ color, size = 21 }) => (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="1.7"><path d="M7 5.5h11M7 11h11M7 16.5h11" /><circle cx="3.6" cy="5.5" r="1.1" fill={color} stroke="none" /><circle cx="3.6" cy="11" r="1.1" fill={color} stroke="none" /><circle cx="3.6" cy="16.5" r="1.1" fill={color} stroke="none" /></svg>
  ),
  saved: ({ color, size = 21 }) => (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="1.7"><path d="M6 3.5h10v15l-5-3.9-5 3.9Z" /></svg>
  ),
  profile: ({ color, size = 21 }) => (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="1.7"><circle cx="11" cy="8" r="3.4" /><path d="M4.6 18.6a6.6 6.6 0 0 1 12.8 0" /></svg>
  ),
};
