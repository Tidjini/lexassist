import { test, expect, request as playwrightRequest } from '@playwright/test';

// Node ne résout pas *.localhost comme le fait un navigateur/curl (getaddrinfo échoue) —
// on cible donc l'IP directement avec un header Host explicite, exactement comme
// django-tenants route déjà les requêtes (par Host, pas par résolution DNS réelle).
const API_BASE_URL = 'http://127.0.0.1:8000';
const TENANT_HOST = 'ecole-test.localhost';
const suffix = Date.now();
const NOM_GROUPE = `Groupe Plan E2E ${suffix}`;

// Le contexte de requête direct (pas l'UI) sert uniquement à préparer les données —
// créer un groupe vide via l'UI est un flux existant, non ré-exercé ici, et souffre
// indépendamment d'un problème de rafraîchissement de liste déjà présent dans
// groupes.spec.ts (pré-existant, sans rapport avec cette fonctionnalité). Le reste du
// test exerce la vraie UI du plan de classe (configuration, affectation, glisser-déposer).
async function creerGroupeViaApi(): Promise<number> {
	const api = await playwrightRequest.newContext({ baseURL: API_BASE_URL, extraHTTPHeaders: { Host: TENANT_HOST } });
	const rToken = await api.post('/api/accounts/token/', {
		data: { email: 'admin@ecole-test.dz', password: 'TestPass123!' }
	});
	const { access_token: token } = await rToken.json();
	const rDossiers = await api.get('/api/dossiers/', { headers: { Authorization: `Bearer ${token}` } });
	const dossiers = await rDossiers.json();
	const dossierId = dossiers.results ? dossiers.results[0].id : dossiers[0].id;
	const rGroupe = await api.post('/api/groupes/', {
		headers: { Authorization: `Bearer ${token}` },
		data: { nom: NOM_GROUPE, dossier: dossierId }
	});
	const groupe = await rGroupe.json();
	await api.dispose();
	return groupe.id;
}

test('plan de classe (Premium) : configurer disposition → affecter → glisser-déposer un échange', async ({ page }) => {
	const groupeId = await creerGroupeViaApi();

	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('admin@ecole-test.dz');
	await page.getByLabel('Password').fill('TestPass123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	await page.goto(`/groupes/${groupeId}/plan`);
	await expect(page).toHaveURL(new RegExp(`/groupes/${groupeId}/plan$`), { timeout: 10000 });

	// École ecole_test doit être en Premium pour ce test (voir super-admin /abonnements).
	// Deux boutons "Configurer la disposition" coexistent (header + état vide) : .first().
	await expect(page.getByText('Aucune disposition configurée')).toBeVisible({ timeout: 10000 });
	await page.getByRole('button', { name: 'Configurer la disposition' }).first().click();
	const dialogConfig = page.getByRole('dialog');
	await expect(dialogConfig.getByRole('heading', { name: 'Configurer la disposition de la salle' })).toBeVisible({
		timeout: 10000
	});
	await dialogConfig.getByLabel('Nombre de rangées').fill('1');
	await dialogConfig.getByLabel('Places par rangée').fill('2');
	await dialogConfig.getByRole('button', { name: 'Générer la disposition' }).click();
	await expect(dialogConfig).not.toBeVisible({ timeout: 10000 });
	await expect(page.getByText('P1', { exact: true })).toBeVisible({ timeout: 10000 });

	// Affecter deux étudiants existants à P1 et P2 (recherche : 2 caractères minimum,
	// voir AffecterPlaceDialog.tsx).
	await page.getByText('P1', { exact: true }).click();
	const dialogAffecter = page.getByRole('dialog');
	await expect(dialogAffecter.getByRole('heading', { name: /Affecter une place/ })).toBeVisible({ timeout: 10000 });
	await dialogAffecter.getByLabel('Nom, prénom ou matricule').fill('an');
	await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10000 });
	await page.getByRole('option').first().click();
	await dialogAffecter.getByRole('button', { name: 'Affecter' }).click();
	await expect(dialogAffecter).not.toBeVisible({ timeout: 10000 });

	await page.getByText('P2', { exact: true }).click();
	const dialogAffecter2 = page.getByRole('dialog');
	await expect(dialogAffecter2.getByRole('heading', { name: /Affecter une place/ })).toBeVisible({ timeout: 10000 });
	await dialogAffecter2.getByLabel('Nom, prénom ou matricule').fill('en');
	await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10000 });
	await page.getByRole('option').first().click();
	await dialogAffecter2.getByRole('button', { name: 'Affecter' }).click();
	await expect(dialogAffecter2).not.toBeVisible({ timeout: 10000 });

	// Glisser-déposer natif : échanger les deux étudiants entre P1 et P2.
	const tuileP1 = page.getByText('P1', { exact: true }).locator('xpath=ancestor::div[contains(@class,"cursor-grab")][1]');
	const tuileP2 = page.getByText('P2', { exact: true }).locator('xpath=ancestor::div[contains(@class,"cursor-grab")][1]');
	await tuileP1.dragTo(tuileP2);
	await page.waitForTimeout(500);
});

test('plan de classe : école repassée en Basic voit le panneau bloqué, puis Premium débloque à nouveau', async ({
	page
}) => {
	// Bascule le plan via le back-office super-admin (même login/nav que abonnements.spec.ts).
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

	const groupeId = await creerGroupeViaApi();

	await page.evaluate(() => window.localStorage.clear());
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('admin@ecole-test.dz');
	await page.getByLabel('Password').fill('TestPass123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	await page.goto(`/groupes/${groupeId}/plan`);
	await expect(page).toHaveURL(new RegExp(`/groupes/${groupeId}/plan$`), { timeout: 10000 });
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
