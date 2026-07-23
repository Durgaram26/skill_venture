import { Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { RoleHomeRedirectPage } from './pages/RoleHomeRedirectPage';
import { ListingsPage } from './pages/ListingsPage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { InstitutionDashboardPage } from './pages/InstitutionDashboardPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { EditListingPage } from './pages/EditListingPage';
import { StudentEnquiriesPage } from './pages/StudentEnquiriesPage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminInstitutionsPage } from './pages/admin/AdminInstitutionsPage';
import { AdminListingsPage } from './pages/admin/AdminListingsPage';
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminSupportPage } from './pages/admin/AdminSupportPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminAdminsPage } from './pages/admin/AdminAdminsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { InstitutionPublicPage } from './pages/InstitutionPublicPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { ComparePage } from './pages/ComparePage';
import { InstitutionBillingPage } from './pages/InstitutionBillingPage';
import { InstitutionAnalyticsPage } from './pages/InstitutionAnalyticsPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { StudentPaymentsPage } from './pages/StudentPaymentsPage';

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<RoleHomeRedirectPage />} />
      <Route path="/listings" element={<ListingsPage />} />
      <Route path="/listings/:slug" element={<ListingDetailPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/institutions/:id" element={<InstitutionPublicPage />} />
      <Route path="/institution" element={<InstitutionDashboardPage />} />
      <Route path="/institution/listings/new" element={<CreateListingPage />} />
      <Route path="/institution/listings/:id/edit" element={<EditListingPage />} />
      <Route path="/institution/billing" element={<InstitutionBillingPage />} />
      <Route path="/institution/analytics" element={<InstitutionAnalyticsPage />} />
      <Route path="/student/enquiries" element={<StudentEnquiriesPage />} />
      <Route path="/student/bookmarks" element={<BookmarksPage />} />
      <Route path="/student/payments" element={<StudentPaymentsPage />} />
      <Route path="/profile" element={<ProfileSettingsPage />} />
      <Route path="/admin" element={<AdminOverviewPage />} />
      <Route path="/admin/institutions" element={<AdminInstitutionsPage />} />
      <Route path="/admin/listings" element={<AdminListingsPage />} />
      <Route path="/admin/reviews" element={<AdminReviewsPage />} />
      <Route path="/admin/users" element={<AdminUsersPage />} />
      <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
      <Route path="/admin/support" element={<AdminSupportPage />} />
      <Route path="/admin/audit" element={<AdminAuditPage />} />
      <Route path="/admin/admins" element={<AdminAdminsPage />} />
      <Route path="/admin/settings" element={<AdminSettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
