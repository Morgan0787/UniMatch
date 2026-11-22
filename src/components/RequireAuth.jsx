import React, { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import ParticleLoader from '@/components/ui/ParticleLoader';

/**
 * Wrap a page component with this to require login. Redirects to /Login
 * (preserving the current URL as ?redirect_to=) if the user isn't
 * authenticated. Used for Profile and Recommendations — Search and Home
 * stay open to everyone.
 */
export default function RequireAuth({ children }) {
  const { isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigateToLogin();
    }
  }, [isLoadingAuth, isAuthenticated, navigateToLogin]);

  if (isLoadingAuth || !isAuthenticated) {
    return <ParticleLoader variant="full" overlay />;
  }

  return children;
}
