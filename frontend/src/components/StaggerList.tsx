import { Children, createContext, useContext, type ReactNode, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';

// Entrées en cascade, version plafonnée (miroir exact du composant mobile PROF —
// même fichier dans mobile-prof/src/components). Deux garde-fous de perf, mesurés
// sur la démo VPS avec CPU bridé (montage d'écran ~3 s de long tasks, lag
// généralisé sur téléphone d'entrée de gamme) :
// 1. seuls les CASCADE_MAX premiers items (au-dessus de la ligne de flottaison)
//    sont animés — chaque item animé coûte un ressort JS au montage, et en
//    animer des dizaines bloque le main thread ; les suivants s'affichent
//    instantanément, hors écran de toute façon.
// 2. cascade coupée quand l'appareil est modeste (peu de cœurs/RAM) ou que
//    l'OS demande moins de mouvement (prefers-reduced-motion).
// Volontairement PAS d'animation `layout` : sur les listes filtrables,
// layout+popLayout laisse des éléments fantômes (leçon apprise côté desktop).
const CASCADE_MAX = 10;
const CASCADE_PAS = 0.03; // s entre deux items

type NavigatorEtendu = Navigator & { deviceMemory?: number };
const appareilModeste =
	typeof navigator !== 'undefined' &&
	((navigator.hardwareConcurrency ?? 8) <= 4 || ((navigator as NavigatorEtendu).deviceMemory ?? 8) <= 4);

const IndexCascade = createContext(0);
const CascadeCoupee = createContext(false);

type StaggerListProps = {
	children: ReactNode;
	style?: CSSProperties;
	className?: string;
};

/** Conteneur d'entrée en cascade ; chaque enfant direct doit être un <StaggerItem>. */
export function StaggerList({ children, style, className }: StaggerListProps) {
	const mouvementReduit = useReducedMotion();
	const coupee = appareilModeste || Boolean(mouvementReduit);
	return (
		<CascadeCoupee.Provider value={coupee}>
			<div
				style={style}
				className={className}
			>
				{Children.map(children, (enfant, index) => (
					<IndexCascade.Provider value={index}>{enfant}</IndexCascade.Provider>
				))}
			</div>
		</CascadeCoupee.Provider>
	);
}

export function StaggerItem({ children, style, className }: StaggerListProps) {
	const index = useContext(IndexCascade);
	const coupee = useContext(CascadeCoupee);

	if (coupee || index >= CASCADE_MAX) {
		return (
			<div
				style={style}
				className={className}
			>
				{children}
			</div>
		);
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 18 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ type: 'spring', stiffness: 260, damping: 22, delay: index * CASCADE_PAS }}
			style={style}
			className={className}
		>
			{children}
		</motion.div>
	);
}
