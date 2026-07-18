import { useId } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion } from 'motion/react';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';

type Segment<T extends string> = {
	valeur: T;
	label: string;
	/** Nom du sprite lucide desktop (ex. "lucide:users"). */
	icone?: string;
};

type SegmentedTabsProps<T extends string> = {
	segments: Segment<T>[];
	valeur: T;
	onChange: (valeur: T) => void;
	accent?: string;
};

/**
 * Segmented control façon iOS : piste discrète arrondie, "pilule" qui glisse
 * d'un segment à l'autre (layoutId + spring). Remplace les ToggleButtonGroup
 * utilisés comme pseudo-onglets. Miroir de mobile-prof/src/components/SegmentedTabs,
 * adapté au desktop : couleurs via theme.vars (dark mode) et icônes FuseSvgIcon.
 */
function SegmentedTabs<T extends string>({ segments, valeur, onChange, accent }: SegmentedTabsProps<T>) {
	const theme = useTheme();
	// layoutId doit être unique par instance : deux SegmentedTabs montés en
	// même temps (transition de route) partageraient sinon la même pilule.
	const idLayout = useId();
	const couleurActive = accent ?? theme.vars.palette.text.primary;

	return (
		<Box
			role="tablist"
			sx={{
				display: 'flex',
				p: '4px',
				borderRadius: '14px',
				bgcolor: `rgba(${theme.vars.palette.text.primaryChannel} / 0.055)`,
				position: 'relative'
			}}
		>
			{segments.map((segment) => {
				const actif = segment.valeur === valeur;
				return (
					<Box
						key={segment.valeur}
						role="tab"
						aria-selected={actif}
						onClick={() => onChange(segment.valeur)}
						sx={{
							flex: 1,
							position: 'relative',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 0.75,
							py: 1,
							px: 1.75,
							borderRadius: '12px',
							cursor: 'pointer',
							whiteSpace: 'nowrap',
							WebkitTapHighlightColor: 'transparent'
						}}
					>
						{actif && (
							<motion.div
								layoutId={`segment-actif-${idLayout}`}
								transition={{ type: 'spring', stiffness: 420, damping: 32 }}
								style={{
									position: 'absolute',
									inset: 0,
									borderRadius: 12,
									background: theme.vars.palette.background.paper,
									border: `1px solid ${theme.vars.palette.divider}`,
									boxShadow: '0 1px 4px rgba(15,17,21,0.10), 0 4px 12px rgba(15,17,21,0.06)'
								}}
							/>
						)}
						{segment.icone && (
							<FuseSvgIcon
								size={16}
								sx={{
									position: 'relative',
									zIndex: 1,
									color: actif ? couleurActive : 'text.secondary',
									transition: 'color 0.2s'
								}}
							>
								{segment.icone}
							</FuseSvgIcon>
						)}
						<Typography
							variant="body2"
							sx={{
								position: 'relative',
								zIndex: 1,
								fontWeight: actif ? 700 : 500,
								color: actif ? couleurActive : 'text.secondary',
								transition: 'color 0.2s'
							}}
						>
							{segment.label}
						</Typography>
					</Box>
				);
			})}
		</Box>
	);
}

export default SegmentedTabs;
