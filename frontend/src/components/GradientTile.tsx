import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

/**
 * Pastille d'icône sur dégradé — motif visuel signature des KPI de l'Accueil,
 * généralisé à toute l'app. Même composant que côté mobile PROF
 * (mobile-prof/src/components/GradientTile.tsx), adapté au sprite lucide
 * du desktop (icone = nom FuseSvgIcon, ex. "lucide:users").
 */
function GradientTile({ icone, couleur, taille = 40 }: { icone: string; couleur: string; taille?: number }) {
	return (
		<div
			style={{
				width: taille,
				height: taille,
				borderRadius: taille * 0.32,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexShrink: 0,
				background: `linear-gradient(135deg, ${couleur}, ${couleur}B8)`,
				boxShadow: `0 4px 12px ${couleur}4D`
			}}
		>
			<FuseSvgIcon
				style={{ color: '#fff' }}
				size={Math.round(taille * 0.5)}
			>
				{icone}
			</FuseSvgIcon>
		</div>
	);
}

export default GradientTile;
