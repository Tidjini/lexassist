import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	workers: 1,
	reporter: 'list',
	// Les tuiles/cartes animées (spring physics) ne "stabilisent" jamais parfaitement
	// pour la détection d'actionabilité de Playwright — délai généreux + clics forcés
	// sur les éléments animés dans les specs, plutôt que supprimer les animations.
	timeout: 60000,
	use: {
		baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	]
});
