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

function extractErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error: meError } = useGetCurrentUser({
    query: { queryKey: ['/api/auth/me'], retry: false },
  });

  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const logoutMutation = useLogout();

  const signIn = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ data: { email, password } });
    queryClient.clear();
    await queryClient.setQueryData(['/api/auth/me'], result);
    return result;
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const result = await signupMutation.mutateAsync({ data: { email, password, name } });
    queryClient.clear();
    await queryClient.setQueryData(['/api/auth/me'], result);
    return result;
  };

  const signOut = async () => {
    await logoutMutation.mutateAsync();
    queryClient.clear();
  };

  // A 401 from /auth/me just means "signed out" — treat as no user, not an error state.
  const resolvedUser = meError ? null : user ?? null;

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
