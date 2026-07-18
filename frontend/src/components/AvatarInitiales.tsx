import { couleurDepuis } from 'src/utils/couleurs';
import { initiales } from 'src/utils/initiales';

/**
 * Avatar à initiales avec couleur déterministe par personne (dégradé doux).
 * Miroir de mobile-prof/src/components/AvatarInitiales — même hash, mêmes
 * couleurs : un étudiant garde le même avatar sur desktop et mobile.
 */
function AvatarInitiales({ nomComplet, taille = 40 }: { nomComplet: string; taille?: number }) {
	const couleur = couleurDepuis(nomComplet);

	return (
		<div
			style={{
				width: taille,
				height: taille,
				borderRadius: '50%',
				flexShrink: 0,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: `linear-gradient(135deg, ${couleur}, ${couleur}C4)`,
				color: '#fff',
				fontWeight: 700,
				fontSize: taille * 0.36,
				letterSpacing: '0.02em'
			}}
		>
			{initiales(nomComplet)}
		</div>
	);
}

export default AvatarInitiales;
