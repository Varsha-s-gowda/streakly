import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { AppShell } from './components/layout/AppShell.jsx';
import { Logo } from './components/Logo.jsx';
import { Spinner } from './components/ui/Spinner.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { RoutinePage } from './pages/RoutinePage.jsx';
import { HabitsPage } from './pages/HabitsPage.jsx';
import { InterviewPage } from './pages/InterviewPage.jsx';
import { CalendarPage } from './pages/CalendarPage.jsx';
import { JournalPage } from './pages/JournalPage.jsx';
import { ManifestationPage } from './pages/ManifestationPage.jsx';
import { AnalyticsPage } from './pages/AnalyticsPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

function FullScreenLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-100">
      <Logo />
      <div className="flex items-center gap-2 text-xs text-ink-muted">
        <Spinner size={14} /> Opening your space…
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoading />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoading />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="routine" element={<RoutinePage />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="interview" element={<InterviewPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="manifestation" element={<ManifestationPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
