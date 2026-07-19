import { alpha } from '@mui/material/styles';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

type IconBadgeProps = {
	icono: string;
	accent: string;
	size?: number;
};

/**
 * Pastille ronde teintée avec une icône — même langage visuel que InitialsAvatar/
 * EmptyState. Ratio icône/pastille volontairement plus généreux (~0.6) que les initiales
 * de InitialsAvatar : à taille égale, un glyphe d'icône (traits fins) lit beaucoup plus
 * petit qu'un texte en gras — Lucia a signalé les icônes de fichiers comme trop petites
 * dans les listes tant que ce composant n'existait pas (elles étaient à 0.5 et surtout à
 * une taille absolue trop basse, 16px).
 */
function IconBadge({ icono, accent, size = 32 }: IconBadgeProps) {
	return (
		<div
			className="flex shrink-0 items-center justify-center rounded-lg"
			style={{ width: size, height: size, backgroundColor: alpha(accent, 0.16) }}
		>
			<FuseSvgIcon
				size={Math.round(size * 0.6)}
				style={{ color: accent }}
			>
				{icono}
			</FuseSvgIcon>
		</div>
	);
}

export default IconBadge;
