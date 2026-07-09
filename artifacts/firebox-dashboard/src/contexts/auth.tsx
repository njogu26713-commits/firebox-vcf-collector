import React, { createContext, useContext } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetCurrentUser,
  useLogin,
  useLogout,
  useSignup,
  type AuthUser,
} from '@workspace/api-client-react';

interface AuthContextValue {
  user: AuthUser | null | undefined;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (email: string, password: string, name?: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  signInError: string | null;
  signUpError: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ME_QUERY_KEY = ['/api/auth/me'] as const;

function extractErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

function is401(error: unknown): boolean {
  return (error as any)?.status === 401;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error: meError } = useGetCurrentUser({
    query: {
      queryKey: ME_QUERY_KEY,
      // Don't retry on 401 — that just means "not signed in"
      retry: (failureCount, error) => !is401(error) && failureCount < 2,
    },
  });

  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const logoutMutation = useLogout();

  const signIn = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ data: { email, password } });
    // Seed the /auth/me cache directly so there's no round-trip race,
    // then invalidate all other queries so they refetch for the new user.
    queryClient.setQueryData(ME_QUERY_KEY, result);
    await queryClient.invalidateQueries({
      predicate: (q) => q.queryKey[0] !== ME_QUERY_KEY[0],
    });
    return result;
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const result = await signupMutation.mutateAsync({ data: { email, password, name } });
    queryClient.setQueryData(ME_QUERY_KEY, result);
    await queryClient.invalidateQueries({
      predicate: (q) => q.queryKey[0] !== ME_QUERY_KEY[0],
    });
    return result;
  };

  const signOut = async () => {
    await logoutMutation.mutateAsync();
    // Clear everything — no cached data should survive a sign-out.
    queryClient.clear();
  };

  // Only a 401 means "not signed in". Transient network/5xx errors should not
  // force a sign-out — preserve whatever data React Query already has cached.
  const resolvedUser = is401(meError) ? null : (user ?? null);

  return (
    <AuthContext.Provider
      value={{
        user: isLoading ? undefined : resolvedUser,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInError: extractErrorMessage(loginMutation.error),
        signUpError: extractErrorMessage(signupMutation.error),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
