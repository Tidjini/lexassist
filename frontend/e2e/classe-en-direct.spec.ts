import { test, expect, request as playwrightRequest } from '@playwright/test';

// Node ne résout pas *.localhost comme le fait un navigateur/curl (getaddrinfo échoue) —
// on cible donc l'IP directement avec un header Host explicite, exactement comme
// django-tenants route déjà les requêtes (par Host, pas par résolution DNS réelle).
const API_BASE_URL = 'http://127.0.0.1:8000';
const TENANT_HOST = 'ecole-test.localhost';
const suffix = Date.now();
const NOM_GROUPE = `Groupe Classe Direct E2E ${suffix}`;
const NOM_ETUDIANT = { nom: 'DirectTest', prenom: 'Un', code: `CDE${suffix}A` };

// Prépare tout via l'API (pas l'UI) : groupe, disposition, étudiant, affectation, séance
// ouverte — l'UI n'est exercée que pour la partie propre à cette fonctionnalité
// (couleur de présence, scan, raccourcis), pas pour les flux déjà couverts ailleurs
// (groupes.spec.ts, groupes-plan.spec.ts).
async function preparerDonnees() {
	const api = await playwrightRequest.newContext({ baseURL: API_BASE_URL, extraHTTPHeaders: { Host: TENANT_HOST } });
	const rToken = await api.post('/api/accounts/token/', {
		data: { email: 'admin@ecole-test.dz', password: 'TestPass123!' }
	});
	const { access_token: token } = await rToken.json();
	const headers = { Authorization: `Bearer ${token}` };

	const rDossiers = await api.get('/api/dossiers/', { headers });
	const dossiers = await rDossiers.json();
	const dossierId = dossiers.results ? dossiers.results[0].id : dossiers[0].id;

	const rGroupe = await api.post('/api/groupes/', { headers, data: { nom: NOM_GROUPE, dossier: dossierId } });
	const groupe = await rGroupe.json();

	await api.post(`/api/groupes/${groupe.id}/configurer_disposition/`, {
		headers,
		data: { nombre_rangees: 1, places_par_rangee: 1, separation_gauche_droite: false }
	});
	const rGroupeAvecPlaces = await api.get(`/api/groupes/${groupe.id}/`, { headers });
	const groupeAvecPlaces = await rGroupeAvecPlaces.json();
	const placeId = groupeAvecPlaces.places[0].id;

	const rEtudiant = await api.post('/api/etudiants/', { headers, data: NOM_ETUDIANT });
	const etudiant = await rEtudiant.json();

	await api.post('/api/affectations/affecter/', {
		headers,
		data: { etudiant: etudiant.id, groupe: groupe.id, place: placeId }
	});

	const rSeance = await api.post('/api/seances/demarrer/', {
		headers,
		data: { groupe: groupe.id, fermer_precedente: true, statut_par_defaut: 'ABSENT' }
	});
	await rSeance.json();

	await api.dispose();
	return { groupeId: groupe.id, codeEtudiant: etudiant.code };
}

test('classe en direct (Premium) : séance ouverte, scan douchette, raccourcis', async ({ page }) => {
	const { groupeId, codeEtudiant } = await preparerDonnees();

	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('admin@ecole-test.dz');
	await page.getByLabel('Password').fill('TestPass123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	await expect(page.getByRole('button', { name: 'Classe en direct' })).toBeVisible({ timeout: 10000 });
	await page.goto(`/classe-en-direct?groupe=${groupeId}`);

	// Bandeau séance ouverte (vert) avec chrono.
	await expect(page.locator('.MuiChip-label', { hasText: /^\d{2}:\d{2}$/ })).toBeVisible({ timeout: 10000 });

	// Établit le focus document avant les raccourcis clavier.
	await page.locator('h5', { hasText: 'Classe en direct' }).click();

	// Mode scanner : raccourci S.
	await page.keyboard.press('s');
	await expect(page.getByRole('button', { name: 'Scanner actif' })).toBeVisible({ timeout: 5000 });

	// Escape avec un dialog ouvert ne doit fermer QUE le dialog, pas le mode scanner
	// (bug trouvé en revue de conception : le listener global doit passer en phase
	// capture et ignorer les raccourcis tant qu'un dialog de cette page est ouvert).
	await page.getByText(NOM_ETUDIANT.prenom, { exact: false }).first().click();
	await expect(page.getByText("Détail de l'étudiant")).toBeVisible({ timeout: 10000 });
	await page.keyboard.press('Escape');
	await expect(page.getByText("Détail de l'étudiant")).not.toBeVisible({ timeout: 5000 });
	await expect(page.getByRole('button', { name: 'Scanner actif' })).toBeVisible({ timeout: 5000 });

	// Simule un scan de douchette USB : frappes rapides puis Entrée.
	await page.keyboard.type(codeEtudiant, { delay: 10 });
	await page.keyboard.press('Enter');
	await expect(page.getByText(/présent/i)).toBeVisible({ timeout: 10000 });

	// Escape sans dialog ouvert désactive bien le mode scanner.
	await page.keyboard.press('Escape');
	await expect(page.getByRole('button', { name: 'Activer le scanner' })).toBeVisible({ timeout: 5000 });
});

test('classe en direct : école non-Premium voit le panneau bloqué', async ({ page }) => {
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('superadmin@schoolavia.dz');
	await page.getByLabel('Password').fill('SuperAdmin123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });
	await page.getByRole('button', { name: 'Abonnements' }).click();
	await page.waitForURL(/\/abonnements/, { timeout: 10000 });
	const ligneAbonnement = page
		.getByText('École Test', { exact: true })
		.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " border-b ")][1]');
	await ligneAbonnement.getByRole('button', { name: 'Basique' }).click();
	await expect(page.getByText('Plan mis à jour')).toBeVisible({ timeout: 10000 });

	await page.evaluate(() => window.localStorage.clear());
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('admin@ecole-test.dz');
	await page.getByLabel('Password').fill('TestPass123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	await page.goto('/classe-en-direct');
	await expect(page.getByText('Fonctionnalité Premium')).toBeVisible({ timeout: 10000 });

	// Repasse en Premium pour ne pas laisser l'environnement de dev bloqué pour la suite.
	await page.evaluate(() => window.localStorage.clear());
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('superadmin@schoolavia.dz');
	await page.getByLabel('Password').fill('SuperAdmin123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.getByRole('button', { name: 'Abonnements' }).click();
	await page.waitForURL(/\/abonnements/, { timeout: 10000 });
	await ligneAbonnement.getByRole('button', { name: 'Premium' }).click();
	await expect(page.getByText('Plan mis à jour')).toBeVisible({ timeout: 10000 });
});
