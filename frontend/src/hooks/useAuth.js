import { useMutation } from '@tanstack/react-query';
import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const authContext = useAuthContext();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const result = await authContext.signIn(email, password);
      if (!result.success) {
        throw new Error(result.error || 'Login failed');
      }
      return result;
    },
    onSuccess: () => {
      router.push('/');
    },
  });

  return {
    ...authContext,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
  };
}

