/**
 * Design tokens de LexAssist : accents par module, dégradé signature et
 * ombres douces en couches, utilisés dans tout le desktop (dashboard, listes,
 * fiches détail).
 */

// Accent visuel par module — sert à teinter icônes, avatars et badges pour
// qu'un même module se reconnaisse d'un écran à l'autre.
export const ACCENTS = {
	inicio: '#1565C0',
	clientes: '#22C55E',
	expedientes: '#3B82F6',
	documentos: '#4338CA',
	alertas: '#D97706',
	requerimientos: '#DC2626'
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

// Style partagé des DataGrid (Clientes/Expedientes/Documentos) : par défaut le composant
// MUI est complètement plat (pas de bordure interne, pas de fond d'en-tête) et se fond
// dans l'arrière-plan de la page — d'où l'effet « tableur brut ». On habille l'en-tête et
// les lignes en s'appuyant sur les variables CSS du thème (compatible clair/sombre sans
// avoir à passer par useTheme dans chaque vue).
export const DATAGRID_SX = {
	border: 'none',
	'--DataGrid-rowBorderColor': 'var(--mui-palette-divider)',
	'& .MuiDataGrid-columnHeaders': {
		backgroundColor: 'var(--mui-palette-action-hover)'
	},
	'& .MuiDataGrid-columnHeaderTitle': {
		fontWeight: 700
	},
	'& .MuiDataGrid-row:hover': {
		backgroundColor: 'var(--mui-palette-action-hover)'
	},
	'& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
		outline: 'none'
	},
	'& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
		outline: 'none'
	}
} as const;

// Carte englobant un DataGrid — donne au tableau une frontière nette et une ombre douce
// au lieu de flotter directement sur le fond de la page.
export const DATAGRID_CARD_SX = {
	borderRadius: 3,
	border: '1px solid var(--mui-palette-divider)',
	boxShadow: OMBRE_CARTE,
	overflow: 'hidden'
} as const;
