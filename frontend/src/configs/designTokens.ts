/**
 * Design tokens partagés avec l'app mobile PROF (mobile-prof/src/theme.ts) —
 * même langage visuel entre le desktop et le mobile : accents par module,
 * dégradé signature et ombres douces en couches.
 *
 * Toute évolution ici doit être répercutée dans mobile-prof/src/theme.ts
 * (et inversement) pour que les deux apps ne divergent pas.
 */

// Accent visuel par module — mêmes teintes que l'app mobile pour que
// l'utilisateur retrouve ses repères d'une app à l'autre.
export const ACCENTS = {
	inicio: '#1565C0',
	clientes: '#22C55E',
	expedientes: '#3B82F6',
	documentos: '#4338CA'
} as const;

// Dégradé signature (login, FAB, boutons héro) — charbon → indigo.
export const GRADIENT_MARQUE = 'linear-gradient(135deg, #1F232B 0%, #312E81 55%, #4338CA 100%)';

// Ombres douces en couches (plus diffuses que les ombres MUI par défaut,
// pensées pour des cartes claires sur fond gris très clair).
export const OMBRE_CARTE = '0 1px 2px rgba(15,17,21,0.04), 0 4px 16px rgba(15,17,21,0.06)';
export const OMBRE_FLOTTANTE = '0 8px 24px rgba(15,17,21,0.14), 0 2px 8px rgba(15,17,21,0.10)';

// Variantes pour fond sombre : l'ombre seule ne se voit presque pas,
// on renforce l'opacité pour garder la hiérarchie de profondeur.
export const OMBRE_CARTE_SOMBRE = '0 1px 2px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.32)';
export const OMBRE_FLOTTANTE_SOMBRE = '0 8px 24px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)';

/** Ombres adaptées au mode de la palette courante. */
export function ombresPourMode(mode: 'light' | 'dark') {
	return mode === 'dark'
		? { carte: OMBRE_CARTE_SOMBRE, flottante: OMBRE_FLOTTANTE_SOMBRE }
		: { carte: OMBRE_CARTE, flottante: OMBRE_FLOTTANTE };
}
