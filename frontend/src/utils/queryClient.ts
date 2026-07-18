import { QueryClient } from '@tanstack/react-query';

/**
 * Instance partagée (App.tsx la fournit au QueryClientProvider) — exportée
 * séparément pour que JwtAuthProvider puisse la vider au signOut sans créer
 * d'import circulaire avec App.tsx.
 */
export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
			retry: 1
		}
	}
});
