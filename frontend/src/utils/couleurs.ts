// Couleur déterministe à partir d'une chaîne (nom d'étudiant, matière…) :
// même entrée → même couleur, pour que les avatars et accents restent stables
// d'un écran et d'une session à l'autre sans rien stocker.
// Miroir de mobile-prof/src/utils/couleurs.ts — toute évolution doit être
// répercutée des deux côtés (copie volontaire, pas de paquet partagé).

// Palette restreinte à des teintes saturées lisibles en blanc-sur-couleur,
// accordées à la palette de l'app (pas de jaunes pâles ni de gris).
const PALETTE = [
	'#2563EB', // bleu
	'#7C3AED', // violet
	'#DB2777', // rose
	'#EA580C', // orange
	'#16A34A', // vert
	'#0D9488', // sarcelle
	'#4338CA', // indigo
	'#C026D3' // fuchsia
];

export function couleurDepuis(texte: string): string {
	let hash = 0;

	for (let i = 0; i < texte.length; i += 1) {
		hash = (hash * 31 + texte.charCodeAt(i)) % 2147483647;
	}

	return PALETTE[Math.abs(hash) % PALETTE.length];
}
