import { test, expect } from '@playwright/test';

const suffix = Date.now();
const NOM_GROUPE = `Groupe E2E ${suffix}`;
const NOM_GROUPE_MODIFIE = `${NOM_GROUPE} modifié`;

test('parcours complet : login → créer groupe → ajouter horaire → archiver → modifier', async ({ page }) => {
	// Login
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('admin@ecole-test.dz');
	await page.getByLabel('Password').fill('TestPass123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	// Créer un groupe (l'admin doit choisir un professeur)
	await page.goto('/groupes');
	await page.getByRole('button', { name: 'Nouveau groupe' }).click();
	await page.getByLabel('Professeur', { exact: true }).click();
	await page.getByRole('option').first().click();
	await page.getByLabel('Nom du groupe').fill(NOM_GROUPE);
	await page.getByLabel('Matière').fill('Physique');
	await page.getByLabel('Niveau').fill('1AS');
	await page.getByRole('button', { name: 'Créer', exact: true }).click();

	const ligneGroupe = page.getByText(NOM_GROUPE, { exact: true });
	await expect(ligneGroupe).toBeVisible({ timeout: 10000 });
	await page.waitForTimeout(500);

	// GroupeRow a maintenant un bouton "voir le détail" avant le crayon "Modifier"
	// (ajout ultérieur) — cibler explicitement par tooltip plutôt que par position.
	const ligne = page
		.getByText(NOM_GROUPE, { exact: true })
		.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " group ")][1]');
	await ligne.hover();
	await ligne.getByRole('button', { name: 'Modifier' }).click();

	const dialog = page.getByRole('dialog');
	await expect(dialog.getByRole('heading', { name: 'Modifier le groupe' })).toBeVisible({ timeout: 10000 });

	// Ajouter un horaire
	await dialog.getByLabel('Début').fill('08:00');
	await dialog.getByLabel('Fin').fill('09:00');
	await dialog.getByRole('button', { name: "Ajouter l'horaire" }).click();
	await expect(dialog.getByText(/08:00–09:00/)).toBeVisible({ timeout: 10000 });

	// Archiver le groupe
	await dialog.getByRole('switch').click();
	await expect(dialog.getByText('Groupe archivé')).toBeVisible();

	// Modifier le nom et enregistrer
	const champNom = dialog.getByLabel('Nom du groupe');
	await champNom.fill(NOM_GROUPE_MODIFIE);
	await dialog.getByRole('button', { name: 'Enregistrer' }).click();

	await expect(page.getByText(NOM_GROUPE_MODIFIE, { exact: true })).toBeVisible({ timeout: 10000 });
	const ligneModifiee = page
		.getByText(NOM_GROUPE_MODIFIE, { exact: true })
		.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " group ")][1]');
	await expect(ligneModifiee.getByText('Archivé')).toBeVisible();
});

test("détail du groupe : ajouter un étudiant existant, en créer un nouveau, puis retirer les deux en groupé", async ({
	page
}) => {
	const suffixLocal = Date.now();
	const NOM_GROUPE_DETAIL = `Groupe Détail E2E ${suffixLocal}`;
	const CODE_EXISTANT = `E2EEXIST${suffixLocal}`;
	const NOM_EXISTANT = `Existant${suffixLocal}`;
	const CODE_NOUVEAU = `E2ENOUV${suffixLocal}`;
	const NOM_NOUVEAU = `Nouveau${suffixLocal}`;

	// Login
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('admin@ecole-test.dz');
	await page.getByLabel('Password').fill('TestPass123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	// Crée un étudiant "existant" à l'avance, pas encore affecté à un groupe, pour le
	// retrouver ensuite via la recherche "Étudiant existant" dans le détail du groupe.
	await page.goto('/etudiants');
	await page.getByRole('button', { name: 'Nouvel étudiant' }).click();
	await page.getByLabel('Nom', { exact: true }).fill(NOM_EXISTANT);
	await page.getByLabel('Prénom').fill('Test');
	await page.getByLabel('Matricule').fill(CODE_EXISTANT);
	await page.getByRole('button', { name: 'Créer', exact: true }).click();
	await expect(page.getByText('Étudiant créé avec succès')).toBeVisible({ timeout: 10000 });

	// Crée le groupe et va sur son détail
	await page.goto('/groupes');
	await page.getByRole('button', { name: 'Nouveau groupe' }).click();
	await page.getByLabel('Professeur', { exact: true }).click();
	await page.getByRole('option').first().click();
	await page.getByLabel('Nom du groupe').fill(NOM_GROUPE_DETAIL);
	await page.getByRole('button', { name: 'Créer', exact: true }).click();
	await expect(page.getByText(NOM_GROUPE_DETAIL, { exact: true })).toBeVisible({ timeout: 10000 });
	await page.waitForTimeout(500);

	const ligneGroupeDetail = page
		.getByText(NOM_GROUPE_DETAIL, { exact: true })
		.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " group ")][1]');
	await ligneGroupeDetail.hover();
	await ligneGroupeDetail.getByRole('button', { name: 'Voir le détail' }).click();
	await expect(page).toHaveURL(/\/groupes\/\d+$/, { timeout: 10000 });

	await page.getByRole('tab', { name: 'Étudiants affectés' }).click();

	// Nouvel étudiant : créé et affecté automatiquement au groupe
	await page.getByRole('button', { name: 'Nouvel étudiant' }).click();
	const dialogEtudiant = page.getByRole('dialog');
	await dialogEtudiant.getByLabel('Nom', { exact: true }).fill(NOM_NOUVEAU);
	await dialogEtudiant.getByLabel('Prénom').fill('Test');
	await dialogEtudiant.getByLabel('Matricule').fill(CODE_NOUVEAU);
	await dialogEtudiant.getByRole('button', { name: 'Créer', exact: true }).click();
	await expect(page.getByText('Étudiant créé et affecté au groupe')).toBeVisible({ timeout: 10000 });
	await expect(page.getByText(`Test ${NOM_NOUVEAU}`, { exact: true })).toBeVisible({ timeout: 10000 });

	// Étudiant existant : recherche serveur + affectation
	await page.getByRole('button', { name: 'Étudiant existant' }).click();
	const dialogRecherche = page.getByRole('dialog');
	await dialogRecherche.getByLabel('Nom, prénom ou matricule').fill(CODE_EXISTANT);
	await page.getByRole('option', { name: new RegExp(CODE_EXISTANT) }).click();
	await dialogRecherche.getByRole('button', { name: 'Affecter' }).click();
	await expect(page.getByText('Étudiant affecté au groupe')).toBeVisible({ timeout: 10000 });
	await expect(page.getByText(`Test ${NOM_EXISTANT}`, { exact: true })).toBeVisible({ timeout: 10000 });

	// Sélection groupée + retrait avec confirmation (warning)
	const ligneNouveau = page
		.getByText(`Test ${NOM_NOUVEAU}`, { exact: true })
		.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " group ")][1]');
	const ligneExistant = page
		.getByText(`Test ${NOM_EXISTANT}`, { exact: true })
		.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " group ")][1]');
	await ligneNouveau.getByRole('checkbox').check();
	await ligneExistant.getByRole('checkbox').check();
	await expect(page.getByText('2 sélectionnés')).toBeVisible();

	await page.getByRole('button', { name: 'Retirer', exact: true }).click();
	const dialogRetrait = page.getByRole('dialog');
	await expect(dialogRetrait.getByText('Retirer du groupe')).toBeVisible();
	await expect(dialogRetrait.getByText(`Test ${NOM_NOUVEAU}`)).toBeVisible();
	await expect(dialogRetrait.getByText(`Test ${NOM_EXISTANT}`)).toBeVisible();
	await dialogRetrait.getByRole('button', { name: 'Retirer', exact: true }).click();

	await expect(page.getByText('étudiants retirés du groupe')).toBeVisible({ timeout: 10000 });
	await expect(page.getByText('Aucun étudiant affecté à ce groupe.')).toBeVisible({ timeout: 10000 });
});

test("un étudiant marqué 'accès gratuit' disparaît de la liste des paiements du groupe", async ({ page }) => {
	const suffixLocal = Date.now();
	const NOM_GROUPE_GRATUIT = `Groupe Gratuit E2E ${suffixLocal}`;
	const CODE_ETUDIANT = `E2EGRAT${suffixLocal}`;
	const NOM_ETUDIANT = `Gratuit${suffixLocal}`;

	// Login
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('admin@ecole-test.dz');
	await page.getByLabel('Password').fill('TestPass123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	// Crée le groupe et va sur son détail
	await page.goto('/groupes');
	await page.getByRole('button', { name: 'Nouveau groupe' }).click();
	await page.getByLabel('Professeur', { exact: true }).click();
	await page.getByRole('option').first().click();
	await page.getByLabel('Nom du groupe').fill(NOM_GROUPE_GRATUIT);
	await page.getByRole('button', { name: 'Créer', exact: true }).click();
	await expect(page.getByText(NOM_GROUPE_GRATUIT, { exact: true })).toBeVisible({ timeout: 10000 });
	await page.waitForTimeout(500);

	const ligneGroupeGratuit = page
		.getByText(NOM_GROUPE_GRATUIT, { exact: true })
		.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " group ")][1]');
	await ligneGroupeGratuit.hover();
	await ligneGroupeGratuit.getByRole('button', { name: 'Voir le détail' }).click();
	await expect(page).toHaveURL(/\/groupes\/\d+$/, { timeout: 10000 });

	// Crée un étudiant et l'affecte directement au groupe
	await page.getByRole('tab', { name: 'Étudiants affectés' }).click();
	await page.getByRole('button', { name: 'Nouvel étudiant' }).click();
	const dialogEtudiant = page.getByRole('dialog');
	await dialogEtudiant.getByLabel('Nom', { exact: true }).fill(NOM_ETUDIANT);
	await dialogEtudiant.getByLabel('Prénom').fill('Test');
	await dialogEtudiant.getByLabel('Matricule').fill(CODE_ETUDIANT);
	await dialogEtudiant.getByRole('button', { name: 'Créer', exact: true }).click();
	await expect(page.getByText('Étudiant créé et affecté au groupe')).toBeVisible({ timeout: 10000 });

	// Onglet Paiements : l'étudiant apparaît normalement (solde 0)
	await page.getByRole('tab', { name: 'Paiements' }).click();
	await expect(page.getByText(`Test ${NOM_ETUDIANT}`, { exact: true })).toBeVisible({ timeout: 10000 });

	// Le marque "accès gratuit" via sa fiche (édition → réglages), depuis la liste
	// étudiants — le tableau "Paiements" de GroupeDetailView n'est pas cliquable.
	await page.goto('/etudiants');
	await page.getByPlaceholder('Rechercher un étudiant, un matricule…').fill(CODE_ETUDIANT);
	const ligneFiche = page.getByText(`Test ${NOM_ETUDIANT}`, { exact: true });
	await expect(ligneFiche).toBeVisible({ timeout: 10000 });
	await ligneFiche.click();
	const dialogFicheEtudiant = page.getByRole('dialog');
	await expect(dialogFicheEtudiant.getByRole('heading', { name: "Modifier l'étudiant" })).toBeVisible({
		timeout: 10000
	});
	await dialogFicheEtudiant.getByRole('button', { name: 'Réglages (tarif, absences)' }).click();
	const dialogReglages = page.getByRole('dialog').last();
	await dialogReglages.getByLabel('Accès gratuit').click();
	await page.getByRole('option', { name: 'Oui' }).click();
	await dialogReglages.getByRole('button', { name: 'Enregistrer' }).click();
	await expect(page.getByText('Réglages enregistrés')).toBeVisible({ timeout: 10000 });
	await dialogFicheEtudiant.getByRole('button', { name: 'Annuler' }).click();

	// Retour au groupe : l'étudiant reste dans "Étudiants affectés" (toutes les
	// manipulations restent possibles) mais disparaît de la liste des paiements.
	await page.goBack();
	await expect(page).toHaveURL(/\/groupes\/\d+$/, { timeout: 10000 });
	await page.getByRole('tab', { name: 'Étudiants affectés' }).click();
	await expect(page.getByText(`Test ${NOM_ETUDIANT}`, { exact: true })).toBeVisible({ timeout: 10000 });

	await page.getByRole('tab', { name: 'Paiements' }).click();
	await expect(page.getByText('Aucun étudiant affecté à ce groupe.')).toBeVisible({ timeout: 10000 });
});

test('détail du groupe : configurer les réglages (tarif, absences) propres au groupe', async ({ page }) => {
	const suffixLocal = Date.now();
	const NOM_GROUPE_REGLAGES = `Groupe Réglages E2E ${suffixLocal}`;

	// Login
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('admin@ecole-test.dz');
	await page.getByLabel('Password').fill('TestPass123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	// Crée le groupe et va sur son détail
	await page.goto('/groupes');
	await page.getByRole('button', { name: 'Nouveau groupe' }).click();
	await page.getByLabel('Professeur', { exact: true }).click();
	await page.getByRole('option').first().click();
	await page.getByLabel('Nom du groupe').fill(NOM_GROUPE_REGLAGES);
	await page.getByRole('button', { name: 'Créer', exact: true }).click();
	await expect(page.getByText(NOM_GROUPE_REGLAGES, { exact: true })).toBeVisible({ timeout: 10000 });
	await page.waitForTimeout(500);

	const ligneGroupeReglages = page
		.getByText(NOM_GROUPE_REGLAGES, { exact: true })
		.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " group ")][1]');
	await ligneGroupeReglages.hover();
	await ligneGroupeReglages.getByRole('button', { name: 'Voir le détail' }).click();
	await expect(page).toHaveURL(/\/groupes\/\d+$/, { timeout: 10000 });

	// Ouvre le dialogue de réglages depuis l'en-tête
	await page.getByRole('button', { name: 'Réglages (tarif, absences)' }).click();
	const dialogReglages = page.getByRole('dialog');
	await expect(dialogReglages.getByText(`Réglages — ${NOM_GROUPE_REGLAGES}`)).toBeVisible({ timeout: 10000 });
	await expect(dialogReglages.getByText(/hérite du réglage du professeur/)).toBeVisible();

	await dialogReglages.getByLabel('Montant (DA)').fill('1500');
	await dialogReglages.getByLabel("Seuil d'absences consécutives avant libération automatique de la place").fill('3');
	await dialogReglages.getByRole('button', { name: 'Enregistrer' }).click();
	await expect(page.getByText('Réglages enregistrés')).toBeVisible({ timeout: 10000 });

	// Réouverture : les valeurs doivent être persistées
	await page.getByRole('button', { name: 'Réglages (tarif, absences)' }).click();
	const dialogReglagesReouvert = page.getByRole('dialog');
	await expect(dialogReglagesReouvert.getByLabel('Montant (DA)')).toHaveValue('1500', { timeout: 10000 });
	await expect(
		dialogReglagesReouvert.getByLabel("Seuil d'absences consécutives avant libération automatique de la place")
	).toHaveValue('3');
});
