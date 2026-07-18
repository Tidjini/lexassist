import { motion } from 'motion/react';
import { alpha } from '@mui/material/styles';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

/**
 * Bouton de statut circulaire (pointage présent/absent, payé/non payé…) :
 * rempli + pop quand sélectionné, teinte légère sinon. Miroir du
 * BoutonPointage de l'app mobile (GroupeDetailScreen), icônes sprite lucide.
 */
function BoutonStatut({
	selectionne,
	couleur,
	icone,
	label,
	taille = 40,
	onClick
}: {
	selectionne: boolean;
	couleur: string;
	/** Nom du sprite lucide (ex. "lucide:check"). */
	icone: string;
	label: string;
	taille?: number;
	onClick: () => void;
}) {
	return (
		<motion.button
			type="button"
			aria-label={label}
			title={label}
			aria-pressed={selectionne}
			onClick={onClick}
			whileHover={selectionne ? undefined : { scale: 1.08 }}
			whileTap={{ scale: 0.8 }}
			animate={selectionne ? { scale: [1, 1.18, 1] } : { scale: 1 }}
			transition={{ type: 'spring', stiffness: 460, damping: 18 }}
			style={{
				width: taille,
				height: taille,
				borderRadius: '50%',
				border: 'none',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				cursor: 'pointer',
				WebkitTapHighlightColor: 'transparent',
				background: selectionne ? couleur : alpha(couleur, 0.1),
				boxShadow: selectionne ? `0 4px 12px ${alpha(couleur, 0.4)}` : 'none',
				transition: 'background 0.18s, box-shadow 0.18s'
			}}
		>
			<FuseSvgIcon
				size={Math.round(taille * 0.45)}
				sx={{ color: selectionne ? '#fff' : couleur }}
			>
				{icone}
			</FuseSvgIcon>
		</motion.button>
	);
}

export default BoutonStatut;
