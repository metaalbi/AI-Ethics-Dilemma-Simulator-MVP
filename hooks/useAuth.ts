import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { AuthState, User } from '@/types';

export function useAuth(requireAuth = false) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    isLoading: true,
  });
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user && requireAuth) {
          router.push('/login?returnUrl=' + encodeURIComponent(window.location.pathname));
          return;
        }

        const { data: admin } = user 
          ? await supabase.rpc('is_admin', { uid: user.id })
          : { data: false };

        setAuthState({
          user,
          isAdmin: !!admin,
          isLoading: false,
        });
      } catch (error) {
        console.error('Auth error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        if (requireAuth) {
          router.push('/login?returnUrl=' + encodeURIComponent(window.location.pathname));
        }
      }
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      
      if (!user && requireAuth) {
        router.push('/login?returnUrl=' + encodeURIComponent(window.location.pathname));
        return;
      }

      const { data: admin } = user 
        ? await supabase.rpc('is_admin', { uid: user.id })
        : { data: false };

      setAuthState({
        user: user || null,
        isAdmin: !!admin,
        isLoading: false,
      });
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [requireAuth, router]);

  return authState;
}