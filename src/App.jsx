import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import AppLayout from './layout/AppLayout.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import BCDetailsPage from './pages/BCDetailsPage.jsx';
import BCMembersPage from './pages/BCMembersPage.jsx';
import BCMonthlyCollectionPage from './pages/BCMonthlyCollectionPage.jsx';
import MembersPage from './pages/MembersPage.jsx';
import PaymentsPage from './pages/PaymentsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import WinnersPage from './pages/WinnersPage.jsx';

export default function App() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist text-sm font-semibold">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />

      <Route
        element={
          isAuthenticated ? (
            <AppLayout />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<DashboardPage />} />

        <Route path="groups" element={<GroupsPage />} />

        {/* BC Details Page */}
        <Route path="groups/:id" element={<BCDetailsPage />} />
        <Route path="groups/:groupId/members" element={<BCMembersPage />} />
        <Route path="groups/:groupId/collections" element={<BCMonthlyCollectionPage />} />

        <Route path="members" element={<MembersPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="winners" element={<WinnersPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}