import { useToastStore } from '../toastStore';

export const Toast = ({ t }) => {
  const toast = useToastStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, padding: '14px 16px', borderRadius: 15,
      bottom: 'calc(84px + env(safe-area-inset-bottom, 0px))',
      background: t.toastBg, color: t.toastFg, fontSize: 12.5, lineHeight: 1.45,
      boxShadow: '0 12px 30px rgba(0,0,0,.3)', animation: 'looPop .26s ease', zIndex: 1200,
    }}
    >
      {toast}
    </div>
  );
};
