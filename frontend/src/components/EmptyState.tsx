import type { ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { motion } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

type EmptyStateProps = {
	icone: string;
	titre: string;
	description?: string;
	accent?: string;
	action?: { label: string; onClick: () => void; icone?: ReactNode };
};

/**
 * État vide illustré, repris de l'app mobile PROF : icône dans une pastille
 * teintée qui "respire", titre + description, CTA optionnel. `icone` est un
 * nom du sprite lucide desktop (ex. "lucide:users").
 */
function EmptyState({ icone, titre, description, accent = '#6B7280', action }: EmptyStateProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 14 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ type: 'spring', stiffness: 220, damping: 24 }}
		>
			<Box sx={{ textAlign: 'center', py: 5, px: 3 }}>
				<motion.div
					animate={{ scale: [1, 1.06, 1] }}
					transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
					style={{
						width: 72,
						height: 72,
						borderRadius: 24,
						margin: '0 auto',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						background: `linear-gradient(135deg, ${alpha(accent, 0.16)}, ${alpha(accent, 0.07)})`
					}}
				>
					<FuseSvgIcon
						style={{ color: accent }}
						size={30}
					>
						{icone}
					</FuseSvgIcon>
				</motion.div>
				<Typography sx={{ fontWeight: 700, mt: 2 }}>{titre}</Typography>
				{description && (
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 0.5, maxWidth: 300, mx: 'auto' }}
					>
						{description}
					</Typography>
				)}
				{action && (
					<Button
						variant="contained"
						startIcon={action.icone}
						onClick={action.onClick}
						sx={{ mt: 2.5, bgcolor: accent, '&:hover': { bgcolor: accent } }}
					>
						{action.label}
					</Button>
				)}
			</Box>
		</motion.div>
	);
}

export default EmptyState;
