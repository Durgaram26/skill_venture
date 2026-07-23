import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { getRoleHomePath } from '../features/auth/roleHome';

/** Legacy `/dashboard` URL — sends signed-in users to their role workspace. */
export function RoleHomeRedirectPage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHomePath(user.role)} replace />;
}
