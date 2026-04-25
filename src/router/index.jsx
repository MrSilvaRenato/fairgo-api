import { createBrowserRouter } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
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

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/',                    element: <HomePage /> },
      { path: '/register',            element: <RegisterPage /> },
      { path: '/login',               element: <LoginPage /> },
      { path: '/companies/register',   element: <CompanyRegisterPage /> },
      { path: '/companies/:slug',       element: <CompanyProfilePage /> },
      { path: '/companies/:slug/claim', element: <ClaimPage /> },
      { path: '/complaints',             element: <ComplaintsPage /> },
      { path: '/complaints/new',        element: <ComplaintFormPage /> },
      { path: '/complaints/:id',         element: <ComplaintPage /> },
      { path: '/complaints/:id/resolve', element: <ResolvePage /> },
      { path: '/dashboard',              element: <ConsumerDashboardPage /> },
      { path: '/company/dashboard',       element: <CompanyDashboardPage /> },
      { path: '/company/analytics',       element: <CompanyAnalyticsPage /> },
      { path: '/company/settings',        element: <CompanySettingsPage /> },
      { path: '/company/billing',          element: <BillingPage /> },
      { path: '/admin',                    element: <AdminPage /> },
      { path: '/search',                   element: <SearchPage /> },
      { path: '/most-complained',          element: <MostComplainedPage /> },
      { path: '/community-guidelines',    element: <CommunityGuidelinesPage /> },
      { path: '/terms',                   element: <TermsPage /> },
      { path: '/privacy',                 element: <PrivacyPage /> },
      { path: '/email/verify',             element: <EmailVerifyPage /> },
      { path: '/forgot-password',          element: <ForgotPasswordPage /> },
      { path: '/reset-password',           element: <ResetPasswordPage /> },
      // Step 15 – /dashboard
      // Step 16 – /company/dashboard
      // Step 21 – /admin
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export default router
