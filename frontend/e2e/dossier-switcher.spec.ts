import { test, expect } from '@playwright/test';

test('séance en cours (prof) + switcher dossier (gestion)', async ({ page }) => {
	// Login prof avec une séance ouverte déjà existante (démo seed_demo_data)
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('prof.belmahi@ecole-test.dz');
	await page.getByLabel('Password').fill('ProfTest123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	await expect(page.getByText('Séance(s) en cours')).toBeVisible({ timeout: 10000 });
	// .first() : peut y avoir plusieurs séances ouvertes en parallèle (rattrapages)
	const carte = page.getByText('Ouverte').locator('xpath=ancestor::div[contains(@class,"cursor-pointer")][1]').first();
	await expect(carte).toBeVisible();
	await carte.click();
	await expect(page).toHaveURL(/\/groupes\/\d+/, { timeout: 10000 });
	await expect(page.getByRole('tab', { name: 'Séance' })).toBeVisible({ timeout: 10000 });

	// Le switcher n'existe pas pour un professeur
	await page.evaluate(() => window.localStorage.clear());

	// Login gestion : switcher visible, section séance en cours cachée par défaut
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('admin@ecole-test.dz');
	await page.getByLabel('Password').fill('TestPass123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	await expect(page.getByText('Tous les professeurs')).toBeVisible({ timeout: 10000 });
	await expect(page.getByText('Séance(s) en cours')).toHaveCount(0);

	// Sélectionner le professeur Belmahi dans le switcher
	await page.getByText('Tous les professeurs').click();
	await page.getByRole('menuitem', { name: 'Amine Belmahi' }).click();
	await expect(page.getByText('Amine Belmahi').first()).toBeVisible({ timeout: 10000 });
	await expect(page.getByText('Séance(s) en cours')).toBeVisible({ timeout: 10000 });

	// Groupes filtrés (navigation SPA : un goto rechargerait la page et perdrait
	// le contexte volontairement non-persisté)
	await page.getByRole('button', { name: 'Groupes' }).click();
	await page.waitForURL(/\/groupes/, { timeout: 10000 });
	await page.waitForTimeout(1000);
	const totalGroupesFiltres = await page.locator('text=Anglais 2AS').count();
	expect(totalGroupesFiltres).toBeGreaterThan(0);

	// Réinitialisation
	await page.getByRole('button', { name: 'Accueil' }).click();
	await page.waitForURL(/\/accueil/, { timeout: 10000 });
	await page.getByText('Amine Belmahi').first().click();
	await page.getByRole('menuitem', { name: 'Tous les professeurs' }).click();
	await expect(page.getByText('Séance(s) en cours')).toHaveCount(0);
});

test("le switcher dossier filtre aussi les pickers de groupe (pas seulement les listes principales)", async ({
	page
}) => {
	const suffix = Date.now();
	const EMAIL_PROF_A = `prof.scopea.${suffix}@ecole-test.dz`;
	const EMAIL_PROF_B = `prof.scopeb.${suffix}@ecole-test.dz`;
	const NOM_PROF_A = `TestA${suffix}`;
	const NOM_PROF_B = `TestB${suffix}`;
	const NOM_GROUPE_A = `Groupe ScopeA ${suffix}`;
	const NOM_GROUPE_B = `Groupe ScopeB ${suffix}`;
	const CODE_ETUDIANT_A = `E2ESCOPE${suffix}`;
	const NOM_ETUDIANT_A = `ScopeEtu${suffix}`;

	// Login gestion
	await page.goto('/sign-in');
	await page.getByLabel('Email').fill('admin@ecole-test.dz');
	await page.getByLabel('Password').fill('TestPass123!');
	await page.getByRole('button', { name: 'Sign in' }).click();
	await expect(page).toHaveURL(/\/accueil/, { timeout: 15000 });

	// Deux professeurs distincts
	await page.goto('/professeurs');
	for (const [email, prenom, nom] of [
		[EMAIL_PROF_A, 'ScopeA', NOM_PROF_A],
		[EMAIL_PROF_B, 'ScopeB', NOM_PROF_B]
	] as const) {
		await page.getByRole('button', { name: 'Nouveau professeur' }).click();
		const dialogProf = page.getByRole('dialog');
		await dialogProf.getByLabel('Email').fill(email);
		await dialogProf.getByLabel('Mot de passe').fill('MotDePasseE2E123');
		await dialogProf.getByLabel('Prénom').fill(prenom);
		await dialogProf.getByLabel('Nom', { exact: true }).fill(nom);
		await dialogProf.getByRole('button', { name: 'Créer', exact: true }).click();
		await expect(page.getByText(email, { exact: true })).toBeVisible({ timeout: 10000 });
	}

	// Un groupe par professeur
	await page.goto('/groupes');
	for (const [nomGroupe, nomProf] of [
		[NOM_GROUPE_A, NOM_PROF_A],
		[NOM_GROUPE_B, NOM_PROF_B]
	] as const) {
		await page.getByRole('button', { name: 'Nouveau groupe' }).click();
		const dialogGroupe = page.getByRole('dialog');
		await dialogGroupe.getByLabel('Professeur', { exact: true }).fill(nomProf);
		await page.getByRole('option', { name: new RegExp(nomProf) }).click();
		await dialogGroupe.getByLabel('Nom du groupe').fill(nomGroupe);
		await dialogGroupe.getByRole('button', { name: 'Créer', exact: true }).click();
		await expect(page.getByText(nomGroupe, { exact: true })).toBeVisible({ timeout: 10000 });
	}

	// Un étudiant affecté au groupe A, sinon la liste étudiants sera vide une fois
	// filtrée sur le professeur A (fraîchement créé, sans aucun étudiant sinon).
	const ligneGroupeA = page
		.getByText(NOM_GROUPE_A, { exact: true })
		.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " group ")][1]');
	await ligneGroupeA.hover();
	await ligneGroupeA.getByRole('button', { name: 'Voir le détail' }).click();
	await expect(page).toHaveURL(/\/groupes\/\d+$/, { timeout: 10000 });
	await page.getByRole('tab', { name: 'Étudiants affectés' }).click();
	await page.getByRole('button', { name: 'Nouvel étudiant' }).click();
	const dialogEtudiant = page.getByRole('dialog');
	await dialogEtudiant.getByLabel('Nom', { exact: true }).fill(NOM_ETUDIANT_A);
	await dialogEtudiant.getByLabel('Prénom').fill('Test');
	await dialogEtudiant.getByLabel('Matricule').fill(CODE_ETUDIANT_A);
	await dialogEtudiant.getByRole('button', { name: 'Créer', exact: true }).click();
	await expect(page.getByText('Étudiant créé et affecté au groupe')).toBeVisible({ timeout: 10000 });

	// Sélectionne le professeur A dans le switcher
	await page.getByText('Tous les professeurs').click();
	await page.getByRole('menuitem', { name: new RegExp(NOM_PROF_A) }).click();
	await expect(page.getByText(NOM_PROF_A).first()).toBeVisible({ timeout: 10000 });

	// Le picker "Affecter à un groupe" (bulk, liste étudiants) ne doit proposer que
	// le groupe du professeur A sélectionné, jamais celui du professeur B. Navigation
	// SPA (pas de page.goto) : un rechargement complet perdrait le contexte du
	// switcher, volontairement non-persisté (voir le test précédent dans ce fichier).
	await page.getByRole('button', { name: 'Étudiants' }).click();
	await page.waitForURL(/\/etudiants/, { timeout: 10000 });
	await page.getByPlaceholder('Rechercher un étudiant, un matricule…').fill(CODE_ETUDIANT_A);
	const ligneEtudiantA = page.getByText(`Test ${NOM_ETUDIANT_A}`, { exact: true });
	await expect(ligneEtudiantA).toBeVisible({ timeout: 10000 });
	const premiereLigne = ligneEtudiantA.locator(
		'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " group ")][1]'
	);
	await premiereLigne.getByRole('checkbox').check();
	await page.getByRole('button', { name: 'Affecter à un groupe' }).click();
	const dialogAffecter = page.getByRole('dialog');
	await dialogAffecter.getByLabel('Groupe', { exact: true }).click();
	await expect(page.getByRole('option', { name: NOM_GROUPE_A })).toBeVisible({ timeout: 10000 });
	await expect(page.getByRole('option', { name: NOM_GROUPE_B })).toHaveCount(0);
	await page.keyboard.press('Escape');
	await dialogAffecter.getByRole('button', { name: 'Annuler' }).click();
});
