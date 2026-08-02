import bcrypt from 'bcrypt';
import type { AuthUser } from '@skillventures/shared-types';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { User, type UserDocument } from '../../models/User.js';
import { Institution } from '../../models/Institution.js';
import { getOrCreatePlatformSettings } from '../../models/PlatformSettings.js';
import type {
  LoginInput,
  RegisterInstitutionInput,
  RegisterStudentInput,
  UpdateProfileInput,
} from './auth.validation.js';
import {
  issueRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
  signAccessToken,
} from './token.service.js';

function toAuthUser(user: UserDocument): AuthUser {
  return {
    id: String(user._id),
    role: user.role,
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    isVerified: user.isVerified,
    isBanned: user.isBanned,
    profile: user.profile
      ? {
          avatar: user.profile.avatar ?? undefined,
          about: user.profile.about ?? undefined,
          city: user.profile.city ?? undefined,
          currentEducationLevel: user.profile.currentEducationLevel ?? undefined,
        }
      : undefined,
  };
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_COST);
}

export async function registerStudent(input: RegisterStudentInput) {
  const settings = await getOrCreatePlatformSettings();
  if (settings.featureFlags?.registrationsOpen === false) {
    throw new AppError('Student registrations are temporarily closed', 403, 'REGISTRATIONS_CLOSED');
  }

  const existing = await User.findOne({ email: input.email }).lean();
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    role: 'student',
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash,
    authProvider: 'local',
    isVerified: false,
    profile: {
      city: input.city,
      currentEducationLevel: input.currentEducationLevel,
    },
  });

  return issueSession(user);
}

export async function registerInstitution(input: RegisterInstitutionInput) {
  const settings = await getOrCreatePlatformSettings();
  if (settings.featureFlags?.institutionSignupsOpen === false) {
    throw new AppError('Institution signups are temporarily closed', 403, 'INSTITUTION_SIGNUPS_CLOSED');
  }

  const existing = await User.findOne({ email: input.email }).lean();
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    role: 'institution',
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash,
    authProvider: 'local',
    isVerified: false,
  });

  try {
    await Institution.create({
      userId: user._id,
      name: input.institutionName,
      type: input.institutionType,
      website: input.website,
      verificationStatus: 'pending',
      location: {
        city: input.city,
        state: input.state,
        address: input.address,
      },
      subscriptionPlan: 'free',
    });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }

  return issueSession(user);
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email });
  if (!user || !user.passwordHash) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }
  if (user.isBanned) {
    throw new AppError('Account is banned', 403, 'ACCOUNT_BANNED');
  }

  const match = await bcrypt.compare(input.password, user.passwordHash);
  if (!match) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  return issueSession(user);
}

export async function refresh(rawRefreshToken: string | undefined) {
  if (!rawRefreshToken) {
    throw new AppError('Refresh token required', 401, 'UNAUTHORIZED');
  }

  try {
    const rotated = await rotateRefreshToken(rawRefreshToken);
    const user = await User.findById(rotated.userId);
    if (!user || user.isBanned) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const { accessToken, expiresIn } = signAccessToken({
      userId: String(user._id),
      role: user.role,
      email: user.email,
    });

    return {
      user: toAuthUser(user),
      accessToken,
      expiresIn,
      refreshToken: rotated.refreshToken,
    };
  } catch (error) {
    const code =
      error instanceof Error && 'code' in error
        ? String((error as { code?: string }).code)
        : 'INVALID_REFRESH';
    throw new AppError('Invalid or expired refresh token', 401, code);
  }
}

export async function logout(rawRefreshToken: string | undefined) {
  if (rawRefreshToken) {
    await revokeRefreshToken(rawRefreshToken);
  }
}

export async function googleAuth(_idToken: string): Promise<{
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}> {
  // Phase 0 stub: Google OAuth requires GOOGLE_CLIENT_ID + token verification.
  // Endpoint exists per §7; full verification lands when OAuth credentials are configured.
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError('Google OAuth is not configured', 501, 'GOOGLE_OAUTH_NOT_CONFIGURED');
  }
  throw new AppError('Google OAuth verification not yet implemented', 501, 'NOT_IMPLEMENTED');
}

export async function getProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  return toAuthUser(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }
  if (user.isBanned) {
    throw new AppError('Account suspended', 403, 'BANNED');
  }

  if (input.email && input.email !== user.email) {
    const existing = await User.findOne({ email: input.email }).lean();
    if (existing && String(existing._id) !== userId) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }
    user.email = input.email;
  }
  if (input.name !== undefined) user.name = input.name;
  if (input.phone !== undefined) {
    user.phone = input.phone.trim() ? input.phone.trim() : undefined;
  }
  if (input.about !== undefined) {
    user.profile = user.profile ?? {};
    user.profile.about = input.about.trim() || undefined;
  }

  await user.save();
  return toAuthUser(user);
}

async function issueSession(user: UserDocument) {
  const { accessToken, expiresIn } = signAccessToken({
    userId: String(user._id),
    role: user.role,
    email: user.email,
  });
  const refreshToken = await issueRefreshToken({
    userId: String(user._id),
    role: user.role,
    email: user.email,
  });

  return {
    user: toAuthUser(user),
    accessToken,
    expiresIn,
    refreshToken,
  };
}
