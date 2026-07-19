import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({ cssVariables: true });

export function renderWithProviders(ui: ReactElement) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
	});

	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<ThemeProvider theme={theme}>
				<QueryClientProvider client={queryClient}>
					<SnackbarProvider>
						<MemoryRouter>{children}</MemoryRouter>
					</SnackbarProvider>
				</QueryClientProvider>
			</ThemeProvider>
		);
	}

	return render(ui, { wrapper: Wrapper });
}
