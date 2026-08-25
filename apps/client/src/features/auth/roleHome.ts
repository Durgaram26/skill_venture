import type { UserRole } from '@skillventures/shared-types';

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case 'institution':
      return '/institution';
    case 'admin':
    case 'super_admin':
      return '/admin';
    default:
      return '/student/jobs';
  }
}
