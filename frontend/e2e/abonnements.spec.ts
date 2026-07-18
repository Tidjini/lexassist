import { test, expect } from '@playwright/test';

test('back-office super-admin : voir les abonnements et enregistrer un paiement', async ({ page }) => {
	const noteUnique = `Test e2e ${Date.now()}`;

	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('superadmin@schoolavia.dz');
	await page.getByLabel('Password').fill('SuperAdmin123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	// Seul l'item "Abonnements" doit être visible dans la nav pour ce rôle (pas de
	// Groupes/Étudiants/Professeurs/Réglages gérés par un super-admin plateforme).
	await expect(page.getByRole('button', { name: 'Abonnements' })).toBeVisible({ timeout: 10000 });

	await page.getByRole('button', { name: 'Abonnements' }).click();
	await page.waitForURL(/\/abonnements/, { timeout: 10000 });

	const ligne = page
		.getByText('École Test', { exact: true })
		.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " border-b ")][1]');
	await expect(ligne).toBeVisible({ timeout: 10000 });
	await expect(ligne.getByText(/dossiers/)).toBeVisible();

	await ligne.getByRole('button', { name: 'Enregistrer un paiement' }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog.getByRole('heading', { name: /Enregistrer un paiement/ })).toBeVisible({ timeout: 10000 });
	await dialog.getByLabel('Montant (DA)').fill('1500');
	await dialog.getByLabel('Note').fill(noteUnique);
	await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();
	await expect(page.getByText('Paiement enregistré')).toBeVisible({ timeout: 10000 });

	// Historique : le paiement vient d'être tracé.
	await ligne.getByRole('button', { name: 'Historique' }).click();
	const dialogHistorique = page.getByRole('dialog');
	await expect(dialogHistorique.getByText(noteUnique)).toBeVisible({ timeout: 10000 });
	await dialogHistorique.getByRole('button', { name: 'Fermer' }).click();
});
