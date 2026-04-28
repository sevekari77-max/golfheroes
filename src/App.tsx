import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { PricingPage } from './pages/PricingPage';
import { CharitiesPage } from './pages/CharitiesPage';
import { CharityProfilePage } from './pages/CharityProfilePage';
import { DrawsPage } from './pages/DrawsPage';

// Dashboard
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { DashboardOverview } from './pages/dashboard/DashboardOverview';
import { ScoresPage } from './pages/dashboard/ScoresPage';
import { CharityPage } from './pages/dashboard/CharityPage';
import { DrawsWinsPage } from './pages/dashboard/DrawsWinsPage';
import { SubscriptionPage } from './pages/dashboard/SubscriptionPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';

// Admin
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminDraws } from './pages/admin/AdminDraws';
import { AdminCharities } from './pages/admin/AdminCharities';
import { AdminWinners } from './pages/admin/AdminWinners';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/charities" element={<CharitiesPage />} />
          <Route path="/charities/:slug" element={<CharityProfilePage />} />
          <Route path="/draws" element={<DrawsPage />} />

          {/* User Dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="scores" element={<ScoresPage />} />
            <Route path="charity" element={<CharityPage />} />
            <Route path="draws" element={<DrawsWinsPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="draws" element={<AdminDraws />} />
            <Route path="charities" element={<AdminCharities />} />
            <Route path="winners" element={<AdminWinners />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
