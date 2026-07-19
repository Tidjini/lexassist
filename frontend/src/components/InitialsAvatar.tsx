import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';

function iniciales(nombre: string) {
	const partes = nombre.trim().split(/\s+/).filter(Boolean);

	if (partes.length === 0) return '?';

	return (partes[0][0] + (partes[1]?.[0] ?? '')).toUpperCase();
}

type InitialsAvatarProps = {
	nombre: string;
	accent: string;
	size?: number;
};

/** Avatar rond à initiales, même langage visuel que EmptyState (fond teinté à l'accent du module). */
function InitialsAvatar({ nombre, accent, size = 36 }: InitialsAvatarProps) {
	return (
		<Avatar
			sx={{
				width: size,
				height: size,
				fontSize: size * 0.4,
				fontWeight: 700,
				bgcolor: alpha(accent, 0.16),
				color: accent
			}}
		>
			{iniciales(nombre)}
		</Avatar>
	);
}

export default InitialsAvatar;
