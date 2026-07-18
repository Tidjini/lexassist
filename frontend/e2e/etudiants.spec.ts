import { test, expect } from '@playwright/test';

const suffix = Date.now();
const NOM_ETUDIANT = `EtudiantReglages${suffix}`;
const CODE_ETUDIANT = `E2EREG${suffix}`;

test("fiche étudiant : configurer les réglages (tarif, absences) propres à l'étudiant", async ({ page }) => {
	// Login
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('admin@ecole-test.dz');
	await page.getByLabel('Password').fill('TestPass123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	// Crée un étudiant
	await page.goto('/etudiants');
	await page.getByRole('button', { name: 'Nouvel étudiant' }).click();
	await page.getByLabel('Nom', { exact: true }).fill(NOM_ETUDIANT);
	await page.getByLabel('Prénom').fill('Test');
	await page.getByLabel('Matricule').fill(CODE_ETUDIANT);
	await page.getByRole('button', { name: 'Créer', exact: true }).click();
	await expect(page.getByText('Étudiant créé avec succès')).toBeVisible({ timeout: 10000 });

	// Recherche l'étudiant tout juste créé (dataset de démo volumineux, la liste est
	// paginée/triée par nom : la recherche par matricule le fait remonter à coup sûr).
	await page.getByPlaceholder('Rechercher un étudiant, un matricule…').fill(CODE_ETUDIANT);
	await expect(page.getByText(`Test ${NOM_ETUDIANT}`, { exact: true })).toBeVisible({ timeout: 10000 });

	// Réouvre sa fiche (édition) et ouvre le dialogue réglages depuis l'en-tête
	await page.getByText(`Test ${NOM_ETUDIANT}`, { exact: true }).click();
	const dialogEtudiant = page.getByRole('dialog');
	await expect(dialogEtudiant.getByRole('heading', { name: "Modifier l'étudiant" })).toBeVisible({
		timeout: 10000
	});

	await dialogEtudiant.getByRole('button', { name: 'Réglages (tarif, absences)' }).click();
	const dialogReglages = page.getByRole('dialog').last();
	await expect(dialogReglages.getByText(`Réglages — Test ${NOM_ETUDIANT}`)).toBeVisible({ timeout: 10000 });
	await expect(dialogReglages.getByText(/hérite du réglage du groupe concerné/)).toBeVisible();

	await dialogReglages.getByLabel('Montant (DA)').fill('2000');
	await dialogReglages
		.getByLabel("Seuil d'absences consécutives avant libération automatique de la place")
		.fill('4');
	await dialogReglages.getByRole('button', { name: 'Enregistrer' }).click();
	await expect(page.getByText('Réglages enregistrés')).toBeVisible({ timeout: 10000 });

	// Réouverture : les valeurs doivent être persistées
	await dialogEtudiant.getByRole('button', { name: 'Réglages (tarif, absences)' }).click();
	const dialogReglagesReouvert = page.getByRole('dialog').last();
	await expect(dialogReglagesReouvert.getByLabel('Montant (DA)')).toHaveValue('2000', { timeout: 10000 });
	await expect(
		dialogReglagesReouvert.getByLabel("Seuil d'absences consécutives avant libération automatique de la place")
	).toHaveValue('4');
});
