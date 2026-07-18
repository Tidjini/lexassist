import { Box, Skeleton } from '@mui/material';

/**
 * Squelette de chargement homogène : remplace les CircularProgress centrés.
 * Des blocs à la forme des cartes réelles donnent une perception de vitesse
 * bien meilleure qu'un spinner. Miroir de mobile-prof/src/components/ListSkeleton.
 */
function ListSkeleton({ lignes = 4, hauteur = 72 }: { lignes?: number; hauteur?: number }) {
	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
			{Array.from({ length: lignes }).map((_, i) => (
				<Skeleton
					key={i}
					variant="rounded"
					height={hauteur}
					sx={{ opacity: 1 - i * 0.18 }}
				/>
			))}
		</Box>
	);
}

export default ListSkeleton;
