import { createBrowserRouter } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import HomePage from '../pages/HomePage'
import NotFoundPage from '../pages/NotFoundPage'
import RegisterPage from '../pages/auth/RegisterPage'
import LoginPage from '../pages/auth/LoginPage'
import CompanyRegisterPage from '../pages/company/CompanyRegisterPage'
import CompanyProfilePage from '../pages/company/CompanyProfilePage'
import ComplaintsPage from '../pages/complaint/ComplaintsPage'
import ComplaintFormPage from '../pages/complaint/ComplaintFormPage'
import ComplaintPage from '../pages/complaint/ComplaintPage'
import ResolvePage from '../pages/complaint/ResolvePage'
import ConsumerDashboardPage from '../pages/consumer/ConsumerDashboardPage'
import CompanyDashboardPage from '../pages/company/CompanyDashboardPage'
import CompanyAnalyticsPage from '../pages/company/CompanyAnalyticsPage'
import CompanySettingsPage from '../pages/company/CompanySettingsPage'
import BillingPage from '../pages/company/BillingPage'
import AdminPage from '../pages/admin/AdminPage'
import SearchPage from '../pages/SearchPage'
import MostComplainedPage from '../pages/MostComplainedPage'
import ClaimPage from '../pages/company/ClaimPage'
import CommunityGuidelinesPage from '../pages/legal/CommunityGuidelinesPage'
import TermsPage from '../pages/legal/TermsPage'
import PrivacyPage from '../pages/legal/PrivacyPage'
import EmailVerifyPage from '../pages/auth/EmailVerifyPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import ProfilePage from '../pages/ProfilePage'

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [

      // ── Fully public ────────────────────────────────────────────────────────
      { path: '/',                         element: <HomePage /> },
      { path: '/register',                 element: <RegisterPage /> },
      { path: '/login',                    element: <LoginPage /> },
      { path: '/forgot-password',          element: <ForgotPasswordPage /> },
      { path: '/reset-password',           element: <ResetPasswordPage /> },
      { path: '/email/verify',             element: <EmailVerifyPage /> },
      { path: '/search',                   element: <SearchPage /> },
      { path: '/most-complained',          element: <MostComplainedPage /> },
      { path: '/complaints',               element: <ComplaintsPage /> },
      { path: '/complaints/:id',           element: <ComplaintPage /> },
      { path: '/companies/:slug',          element: <CompanyProfilePage /> },
      { path: '/companies/:slug/claim',    element: <ClaimPage /> },
      { path: '/community-guidelines',     element: <CommunityGuidelinesPage /> },
      { path: '/terms',                    element: <TermsPage /> },
      { path: '/privacy',                  element: <PrivacyPage /> },

      // ── Any authenticated user ───────────────────────────────────────────
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/profile',              element: <ProfilePage /> },
          { path: '/complaints/new',       element: <ComplaintFormPage /> },
          { path: '/complaints/:id/resolve', element: <ResolvePage /> },
        ],
      },

      // ── Consumer only ────────────────────────────────────────────────────
      {
        element: <ProtectedRoute role="consumer" />,
        children: [
          { path: '/dashboard',            element: <ConsumerDashboardPage /> },
        ],
      },

      // ── Company admin only ───────────────────────────────────────────────
      {
        element: <ProtectedRoute role="company_admin" />,
        children: [
          { path: '/company/dashboard',    element: <CompanyDashboardPage /> },
          { path: '/company/analytics',    element: <CompanyAnalyticsPage /> },
          { path: '/company/settings',     element: <CompanySettingsPage /> },
          { path: '/company/billing',      element: <BillingPage /> },
          { path: '/companies/register',   element: <CompanyRegisterPage /> },
        ],
      },

      // ── Admin only ───────────────────────────────────────────────────────
      {
        element: <ProtectedRoute role="admin" />,
        children: [
          { path: '/admin',                element: <AdminPage /> },
        ],
      },

    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export default router
