import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import { useStore } from './store';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';

import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import MapScreen from './screens/MapScreen';
import ListScreen from './screens/ListScreen';
import DetailScreen from './screens/DetailScreen';
import ReviewScreen from './screens/ReviewScreen';
import AddScreen from './screens/AddScreen';
import FiltersScreen from './screens/FiltersScreen';
import SavedScreen from './screens/SavedScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';

const WithNav = ({ t, children }) => (
  <>
    {children}
    <BottomNav t={t} />
  </>
);

const RequireOnboarding = ({ children }) => {
  const onboarded = useStore((s) => s.onboarded);
  return onboarded ? children : <Navigate to="/onboarding" replace />;
};

function App() {
  const { t } = useTheme();

  return (
    <div className="phone">
      <Routes>
        <Route path="/onboarding" element={<Onboarding t={t} />} />
        <Route path="/" element={<RequireOnboarding><WithNav t={t}><Home t={t} /></WithNav></RequireOnboarding>} />
        <Route path="/map" element={<RequireOnboarding><WithNav t={t}><MapScreen t={t} /></WithNav></RequireOnboarding>} />
        <Route path="/list" element={<RequireOnboarding><WithNav t={t}><ListScreen t={t} /></WithNav></RequireOnboarding>} />
        <Route path="/saved" element={<RequireOnboarding><WithNav t={t}><SavedScreen t={t} /></WithNav></RequireOnboarding>} />
        <Route path="/profile" element={<RequireOnboarding><WithNav t={t}><ProfileScreen t={t} /></WithNav></RequireOnboarding>} />
        <Route path="/washroom/:id" element={<RequireOnboarding><DetailScreen t={t} /></RequireOnboarding>} />
        <Route path="/washroom/:id/review" element={<RequireOnboarding><ReviewScreen t={t} /></RequireOnboarding>} />
        <Route path="/add" element={<RequireOnboarding><AddScreen t={t} /></RequireOnboarding>} />
        <Route path="/filters" element={<RequireOnboarding><FiltersScreen t={t} /></RequireOnboarding>} />
        <Route path="/settings" element={<RequireOnboarding><SettingsScreen t={t} /></RequireOnboarding>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast t={t} />
    </div>
  );
}

export default App;
