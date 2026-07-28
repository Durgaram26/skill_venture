export type UserRole = 'student' | 'institution' | 'admin' | 'super_admin';

export type AuthProvider = 'local' | 'google';

export type InstitutionType =
  'college' | 'university' | 'training-institute' | 'edtech' | 'bootcamp-provider';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export type SubscriptionPlan = 'free' | 'standard' | 'premium';

export type ListingType = 'course' | 'bootcamp' | 'hackathon';

export type ListingMode = 'online' | 'offline' | 'hybrid';

export type ListingStatus = 'draft' | 'pending_review' | 'published' | 'paused' | 'rejected';

export type EnquiryStatus = 'new' | 'contacted' | 'converted' | 'lost';

export type ModerationStatus = 'visible' | 'flagged' | 'removed';

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due';

export type DurationUnit = 'days' | 'weeks' | 'months' | 'hours';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  isBanned: boolean;
  profile?: {
    avatar?: string;
    city?: string;
    currentEducationLevel?: string;
  };
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface AuthPayload {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListingFee {
  amount: number;
  currency: string;
  isFree: boolean;
}

export interface ListingDuration {
  value: number;
  unit: DurationUnit;
}

export interface ListingSummary {
  id: string;
  institutionId: string;
  type: ListingType;
  title: string;
  slug: string;
  description: string;
  category: string;
  subCategory?: string;
  fee: ListingFee;
  duration: ListingDuration;
  mode: ListingMode;
  location?: { city?: string; state?: string; address?: string };
  eligibility?: string;
  curriculum?: { title: string; description?: string }[];
  placementSupport: boolean;
  certificateProvided: boolean;
  status: ListingStatus;
  isFeatured: boolean;
  bootcamp?: {
    startDate?: string;
    endDate?: string;
    sessionMode?: string;
    seatsAvailable?: number;
  };
  hackathon?: {
    startDate?: string;
    endDate?: string;
    prizePool?: number;
    teamSizeMax?: number;
    sponsors?: string[];
  };
  stats: { views: number; enquiries: number };
  rating: { avg: number; count: number };
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionSummary {
  id: string;
  name: string;
  type: InstitutionType;
  description?: string;
  logo?: string;
  website?: string;
  verificationStatus: VerificationStatus;
  location: { city: string; state: string; address?: string };
  rating: { avg: number; count: number };
  subscriptionPlan: SubscriptionPlan;
}

export interface EnquirySummary {
  id: string;
  /** null for guest enquiries submitted without a student login */
  studentId: string | null;
  listingId: string;
  institutionId: string;
  message: string;
  contactInfo: { name: string; phone: string; email: string };
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
  listing?: Pick<ListingSummary, 'id' | 'title' | 'slug' | 'type'>;
}
