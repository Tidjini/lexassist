import { forwardRef, type ReactNode, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '@mui/material/styles';

type PressableCardProps = {
	children: ReactNode;
	onClick?: () => void;
	style?: CSSProperties;
	className?: string;
};

/**
 * Carte de base du langage visuel partagé avec l'app mobile PROF : surface
 * papier, bord discret, ombre douce. Adaptée à la souris : lift au survol
 * (ombre flottante) quand elle est cliquable, léger scale à l'appui.
 */
const PressableCard = forwardRef<HTMLDivElement, PressableCardProps>(function PressableCard(
	{ children, onClick, style, className },
	ref
) {
	const theme = useTheme();
	return (
		<motion.div
			ref={ref}
			onClick={onClick}
			whileHover={onClick ? { y: -3, boxShadow: theme.shadows[8] } : undefined}
			whileTap={onClick ? { scale: 0.985 } : undefined}
			transition={{ type: 'spring', stiffness: 480, damping: 28 }}
			className={className}
			style={{
				background: theme.vars.palette.background.paper,
				border: `1px solid ${theme.vars.palette.divider}`,
				borderRadius: 18,
				boxShadow: theme.shadows[1],
				cursor: onClick ? 'pointer' : undefined,
				...style
			}}
		>
			{children}
		</motion.div>
	);
});

export default PressableCard;
