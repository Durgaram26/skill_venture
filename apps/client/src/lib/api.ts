import type {
  ApiResponse,
  AuthPayload,
  EnquirySummary,
  ListingSummary,
  PaginatedResult,
  InstitutionSummary,
} from '@skillventures/shared-types';
import { useAuthStore } from '../features/auth/authStore';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export type PublicProfile = Pick<AuthPayload['user'], 'id' | 'role' | 'name' | 'profile'>;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers,
  });

  const body = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !body.success) {
    const error = !body.success
      ? body.error
      : { message: 'Request failed', code: 'REQUEST_FAILED' };
    throw new ApiError(error.message, error.code, response.status);
  }
  return body.data;
}

export const api = {
  registerStudent(payload: Record<string, unknown>) {
    return request<AuthPayload>('/api/v1/auth/register/student', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  registerInstitution(payload: Record<string, unknown>) {
    return request<AuthPayload>('/api/v1/auth/register/institution', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  login(payload: { email: string; password: string }) {
    return request<AuthPayload>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  refresh() {
    return request<AuthPayload>('/api/v1/auth/refresh', { method: 'POST' });
  },
  logout() {
    return request<{ loggedOut: boolean }>('/api/v1/auth/logout', { method: 'POST' });
  },
  me() {
    return request<{ user: AuthPayload['user'] }>('/api/v1/auth/me');
  },
  publicProfile(id: string) {
    return request<{ user: PublicProfile }>(`/api/v1/auth/users/${id}`);
  },
  updateProfile(payload: { name?: string; email?: string; phone?: string; about?: string }) {
    return request<{ user: AuthPayload['user'] }>('/api/v1/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  listListings(params: URLSearchParams) {
    return request<PaginatedResult<ListingSummary>>(`/api/v1/listings?${params.toString()}`);
  },
  searchListings(q: string) {
    return request<PaginatedResult<ListingSummary>>(
      `/api/v1/listings/search?q=${encodeURIComponent(q)}`,
    );
  },
  suggestSearch(q: string) {
    return request<{
      suggestions: string[];
      programs: ListingSummary[];
      institutions: {
        id: string;
        name: string;
        city: string;
        state: string;
        verificationStatus: string;
      }[];
    }>(`/api/v1/listings/suggest?q=${encodeURIComponent(q)}`);
  },
  getListing(slug: string) {
    return request<{
      listing: ListingSummary;
      institution: Partial<InstitutionSummary> | null;
    }>(`/api/v1/listings/${slug}`);
  },
  getInstitution(id: string) {
    return request<{ institution: InstitutionSummary }>(`/api/v1/institutions/${id}`);
  },
  getInstitutionListings(id: string) {
    return request<PaginatedResult<ListingSummary>>(`/api/v1/institutions/${id}/listings`);
  },

  myListings() {
    return request<PaginatedResult<ListingSummary>>('/api/v1/institutions/me/listings');
  },
  getMyListing(id: string) {
    return request<{ listing: ListingSummary }>(`/api/v1/institutions/me/listings/${id}`);
  },
  createListing(payload: Record<string, unknown>) {
    return request<{ listing: ListingSummary }>('/api/v1/institutions/me/listings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  uploadListingImage(payload: { mimeType: string; data: string; fileName?: string }) {
    return request<{ file: { url: string; fileName: string; size: number } }>(
      '/api/v1/institutions/me/uploads/listing-image',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  },
  updateListing(id: string, payload: Record<string, unknown>) {
    return request<{ listing: ListingSummary }>(`/api/v1/institutions/me/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteListing(id: string) {
    return request<{ deleted: boolean }>(`/api/v1/institutions/me/listings/${id}`, {
      method: 'DELETE',
    });
  },

  createEnquiry(payload: {
    listingId: string;
    message: string;
    contactInfo?: { name: string; phone: string; email: string };
  }) {
    return request<{ enquiry: EnquirySummary }>('/api/v1/enquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  myStudentEnquiries() {
    return request<PaginatedResult<EnquirySummary>>('/api/v1/students/me/enquiries');
  },
  myInstitutionEnquiries(status?: string) {
    const q = status ? `?status=${status}` : '';
    return request<PaginatedResult<EnquirySummary>>(`/api/v1/institutions/me/enquiries${q}`);
  },
  updateEnquiryStatus(id: string, status: string) {
    return request<{ enquiry: EnquirySummary }>(`/api/v1/institutions/me/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  adminInstitutions(status?: string) {
    const q = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return request<PaginatedResult<Record<string, unknown>>>(`/api/v1/admin/institutions${q}`);
  },
  verifyInstitution(id: string, verificationStatus: 'verified' | 'rejected', reason?: string) {
    return request<{ institution: { id: string; verificationStatus: string } }>(
      `/api/v1/admin/institutions/${id}/verify`,
      {
        method: 'PATCH',
        body: JSON.stringify({ verificationStatus, reason }),
      },
    );
  },
  adminListings(status = 'pending_review') {
    const q =
      status === 'all'
        ? '?status=all'
        : `?status=${encodeURIComponent(status)}`;
    return request<PaginatedResult<ListingSummary>>(`/api/v1/admin/listings${q}`);
  },
  moderateListing(id: string, status: 'published' | 'rejected' | 'paused', reason?: string) {
    return request<{ listing: ListingSummary }>(`/api/v1/admin/listings/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },
  adminReviews(status = 'flagged') {
    const q =
      status === 'all'
        ? '?status=all'
        : `?status=${encodeURIComponent(status)}`;
    return request<
      PaginatedResult<{
        id: string;
        studentId: string;
        listingId: string;
        institutionId: string;
        rating: number;
        comment?: string;
        isVerifiedApplicant: boolean;
        moderationStatus: string;
        createdAt: string;
      }>
    >(`/api/v1/admin/reviews${q}`);
  },
  moderateReview(id: string, moderationStatus: 'visible' | 'removed', reason?: string) {
    return request<{ review: { id: string; moderationStatus: string } }>(
      `/api/v1/admin/reviews/${id}/moderate`,
      {
        method: 'PATCH',
        body: JSON.stringify({ moderationStatus, reason }),
      },
    );
  },
  adminUsers(params?: { role?: string; banned?: string }) {
    const q = new URLSearchParams();
    if (params?.role) q.set('role', params.role);
    if (params?.banned) q.set('banned', params.banned);
    const qs = q.toString();
    return request<
      PaginatedResult<{
        id: string;
        name: string;
        email: string;
        role: string;
        isVerified: boolean;
        isBanned: boolean;
        createdAt: string;
      }>
    >(`/api/v1/admin/users${qs ? `?${qs}` : ''}`);
  },
  banUser(id: string, isBanned: boolean) {
    return request<{ user: { id: string; isBanned: boolean } }>(`/api/v1/admin/users/${id}/ban`, {
      method: 'PATCH',
      body: JSON.stringify({ isBanned }),
    });
  },
  adminAnalytics() {
    return request<{
      students: number;
      institutions: number;
      pendingInstitutions: number;
      publishedListings: number;
      pendingListings: number;
      enquiries: number;
      flaggedReviews: number;
      bannedUsers: number;
      activeSubscriptions: number;
      paidOrders: number;
      featuredListings: number;
      revenueInr: number;
    }>('/api/v1/admin/analytics');
  },
  adminFinancialReport() {
    return request<{
      totalRevenueInr: number;
      paidOrderCount: number;
      revenueByType: { type: string; revenueInr: number; count: number }[];
      activePlans: { plan: string; count: number }[];
      monthlyRevenue: { month: string; revenueInr: number }[];
    }>('/api/v1/admin/analytics/financial');
  },
  adminAuditLogs(page = 1) {
    return request<
      PaginatedResult<{
        id: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata?: Record<string, unknown>;
        createdAt: string;
        actor?: { id: string; name: string; email: string; role: string };
      }>
    >(`/api/v1/admin/audit-logs?page=${page}`);
  },
  adminTeam() {
    return request<{
      items: { id: string; name: string; email: string; role: string; createdAt: string }[];
    }>('/api/v1/admin/admins');
  },
  setUserRole(id: string, role: 'student' | 'admin' | 'super_admin') {
    return request<{ user: { id: string; role: string } }>(`/api/v1/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },
  adminSettings() {
    return request<{
      settings: {
        heroHeadline: string;
        heroSubheadline: string;
        categories: string[];
        featureFlags: {
          registrationsOpen: boolean;
          featuredListingsEnabled: boolean;
          institutionSignupsOpen: boolean;
        };
      };
    }>('/api/v1/admin/settings');
  },
  updateAdminSettings(body: Record<string, unknown>) {
    return request<{ settings: Record<string, unknown> }>('/api/v1/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  platformSettings() {
    return request<{
      settings: {
        heroHeadline: string;
        heroSubheadline: string;
        categories: string[];
        featureFlags: Record<string, boolean>;
      };
    }>('/api/v1/platform/settings');
  },
  adminSupportTickets(status = 'open') {
    const q = status === 'all' ? '?status=all' : `?status=${encodeURIComponent(status)}`;
    return request<
      PaginatedResult<{
        id: string;
        reporterEmail: string;
        reporterName?: string;
        subject: string;
        body: string;
        category: string;
        status: string;
        adminNotes?: string;
        createdAt: string;
      }>
    >(`/api/v1/admin/support/tickets${q}`);
  },
  updateSupportTicket(id: string, body: { status?: string; adminNotes?: string }) {
    return request<{ ticket: { id: string; status: string } }>(
      `/api/v1/admin/support/tickets/${id}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    );
  },

  compareListings(ids: string[]) {
    return request<{ items: ListingSummary[] }>(
      `/api/v1/listings/compare?ids=${ids.map(encodeURIComponent).join(',')}`,
    );
  },
  addBookmark(listingId: string) {
    return request<{ bookmarked: boolean }>(`/api/v1/bookmarks/${listingId}`, {
      method: 'POST',
    });
  },
  removeBookmark(listingId: string) {
    return request<{ bookmarked: boolean }>(`/api/v1/bookmarks/${listingId}`, {
      method: 'DELETE',
    });
  },
  myBookmarks() {
    return request<{
      items: {
        id: string;
        listingId: string;
        createdAt: string;
        listing: ListingSummary;
      }[];
    }>('/api/v1/students/me/bookmarks');
  },
  myNotifications() {
    return request<
      PaginatedResult<{
        id: string;
        type: string;
        title: string;
        body: string;
        isRead: boolean;
        createdAt: string;
      }>
    >('/api/v1/notifications');
  },
  registerPushToken(token: string, platform: 'web' | 'android' | 'ios' = 'web') {
    return request<{ registered: boolean }>('/api/v1/notifications/push/register', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  },

  listReviews(listingId: string) {
    return request<{
      items: {
        id: string;
        rating: number;
        comment?: string;
        isVerifiedApplicant: boolean;
        institutionReply?: { text: string; repliedAt: string };
        createdAt: string;
      }[];
    }>(`/api/v1/listings/${listingId}/reviews`);
  },
  createReview(payload: { listingId: string; rating: number; comment?: string }) {
    return request<{
      review: { id: string; rating: number; isVerifiedApplicant: boolean };
    }>('/api/v1/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  replyToReview(id: string, text: string) {
    return request<{ review: { id: string } }>(`/api/v1/reviews/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  createPaymentOrder(
    payload:
      | { type: 'subscription'; plan: 'standard' | 'premium' }
      | { type: 'featured'; listingId: string; days?: number },
  ) {
    return request<{
      orderId: string;
      amount: number;
      currency: string;
      keyId: string | null;
      mock: boolean;
      purpose: string;
      plan?: string;
      listingId?: string;
      days?: number;
    }>('/api/v1/subscriptions/create-order', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  createEnrollmentOrder(listingId: string) {
    return request<{
      orderId: string;
      amount: number;
      currency: string;
      keyId: string | null;
      mock: boolean;
      purpose: 'enrollment';
      listingId: string;
      listingTitle: string;
      platformFeePaise: number;
      institutionPayoutPaise: number;
      platformPercent: number;
    }>('/api/v1/subscriptions/enroll', {
      method: 'POST',
      body: JSON.stringify({ listingId }),
    });
  },
  confirmMockPayment(orderId: string) {
    return request<{ alreadyProcessed: boolean; type?: string }>(
      '/api/v1/subscriptions/confirm-mock',
      {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      },
    );
  },
  myPayments() {
    return request<{
      commissionPercent: number;
      items: {
        id: string;
        status: string;
        amountPaise: number;
        platformFeePaise: number;
        institutionPayoutPaise: number;
        listingTitle: string;
        listingSlug: string | null;
        createdAt: string;
      }[];
    }>('/api/v1/students/me/payments');
  },
  myEarnings() {
    return request<{
      commissionPercent: number;
      summary: {
        paidCount: number;
        grossPaise: number;
        platformFeePaise: number;
        netPaise: number;
      };
      items: {
        id: string;
        status: string;
        amountPaise: number;
        platformFeePaise: number;
        institutionPayoutPaise: number;
        listingTitle: string;
        listingSlug: string | null;
        studentName: string;
        studentEmail: string;
        createdAt: string;
      }[];
    }>('/api/v1/institutions/me/earnings');
  },
  myPayoutDetails() {
    return request<{
      payout: {
        configured: boolean;
        method: 'bank' | 'upi';
        accountHolderName: string;
        bankName: string;
        accountNumber: string;
        accountNumberMasked: string;
        ifsc: string;
        upiId: string;
        status: 'none' | 'mock' | 'pending' | 'verified';
        updatedAt: string | null;
        mockNote: string;
      };
    }>('/api/v1/institutions/me/payout');
  },
  updatePayoutDetails(payload: {
    method: 'bank' | 'upi';
    accountHolderName: string;
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    upiId?: string;
  }) {
    return request<{
      payout: {
        configured: boolean;
        method: 'bank' | 'upi';
        accountHolderName: string;
        bankName: string;
        accountNumber: string;
        accountNumberMasked: string;
        ifsc: string;
        upiId: string;
        status: 'none' | 'mock' | 'pending' | 'verified';
        updatedAt: string | null;
        mockNote: string;
      };
    }>('/api/v1/institutions/me/payout', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  mySubscription() {
    return request<{
      plan: string;
      expiresAt: string | null;
      subscription: {
        id: string;
        plan: string;
        status: string;
        amount: number;
        currentPeriodEnd: string;
      } | null;
      plans: Record<string, { amountPaise: number; label: string; listingLimit: number }>;
      featuredBoost: { amountPaise: number; defaultDays: number; label: string };
    }>('/api/v1/institutions/me/subscription');
  },
  myAnalytics() {
    return request<{
      summary: {
        listings: number;
        publishedListings: number;
        totalViews: number;
        totalEnquiries: number;
        contacted: number;
        converted: number;
        conversionRate: number;
      };
      topListings: {
        id: string;
        title: string;
        slug: string;
        views: number;
        enquiries: number;
        status: string;
        isFeatured: boolean;
      }[];
    }>('/api/v1/institutions/me/analytics');
  },
};
