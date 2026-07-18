import { test, expect } from '@playwright/test';

const suffix = Date.now();
const EMAIL_PROF = `prof.e2e.${suffix}@ecole-test.dz`;
const PASSWORD_PROF = 'MotDePasseE2E123';

async function seDeconnecter(page: import('@playwright/test').Page) {
	await page.evaluate(() => window.localStorage.clear());
	await page.goto('/sign-in');
}

test('parcours complet : gestion crée un professeur → menu caché pour le prof → désactivation bloque la connexion', async ({
	page
}) => {
	// Login gestion
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('admin@ecole-test.dz');
	await page.getByLabel('Password').fill('TestPass123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	// Le menu "Professeurs" est visible pour la gestion (item de nav = role="button").
	// exact:true nécessaire depuis l'ajout du DossierSwitcher ("Tous les professeurs").
	await expect(page.getByRole('button', { name: 'Professeurs', exact: true })).toBeVisible({ timeout: 10000 });

	// Créer un compte professeur
	await page.goto('/professeurs');
	await page.getByRole('button', { name: 'Nouveau professeur' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByLabel('Email').fill(EMAIL_PROF);
	await dialog.getByLabel('Mot de passe').fill(PASSWORD_PROF);
	await dialog.getByLabel('Prénom').fill('Karim');
	await dialog.getByLabel('Nom', { exact: true }).fill('Ziani');
	await dialog.getByRole('button', { name: 'Créer', exact: true }).click();

	await expect(page.getByText(EMAIL_PROF, { exact: true })).toBeVisible({ timeout: 10000 });

	// Se déconnecter et se connecter avec le nouveau compte professeur
	await seDeconnecter(page);
	await page.getByLabel('Email').fill(EMAIL_PROF);
	await page.getByLabel('Password').fill(PASSWORD_PROF);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	// Le menu "Professeurs" est absent pour un professeur
	await expect(page.getByRole('button', { name: 'Professeurs' })).toHaveCount(0);

	// Navigation directe vers /professeurs redirigée (accès non autorisé)
	await page.goto('/professeurs');
	await expect(page).not.toHaveURL(/\/professeurs$/, { timeout: 10000 });

	// Retour en gestion, désactiver ce compte
	await seDeconnecter(page);
	await page.getByLabel('Email').fill('admin@ecole-test.dz');
	await page.getByLabel('Password').fill('TestPass123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	await page.goto('/professeurs');
	const ligne = page
		.getByText(EMAIL_PROF, { exact: true })
		.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " group ")][1]');
	await ligne.hover();
	// Nommé explicitement : la ligne a aussi un bouton "Réglages" depuis son ajout.
	await ligne.getByRole('button', { name: 'Désactiver le compte' }).click();
	await expect(ligne.getByText('Désactivé')).toBeVisible({ timeout: 10000 });

	// Le compte désactivé ne peut plus se connecter : la connexion échoue et reste
	// sur /sign-in (le frontend n'affiche pas encore le message d'erreur du backend
	// pour un login invalide — gap pré-existant, hors scope ici).
	await seDeconnecter(page);
	await page.getByLabel('Email').fill(EMAIL_PROF);
	await page.getByLabel('Password').fill(PASSWORD_PROF);
	await page.getByRole('button', { name: 'Sign in' }).click();
	await page.waitForTimeout(2000);
	await expect(page).toHaveURL(/\/sign-in/);
});
