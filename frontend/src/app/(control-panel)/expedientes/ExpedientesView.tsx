import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

/**
 * Placeholder — module en construction (Phase 1).
 */
function ExpedientesView() {
	return (
		<FusePageSimple
			content={
				<div className="flex w-full flex-col p-6 md:p-10">
					<Paper className="flex flex-col items-center gap-4 rounded-xl p-12 text-center">
						<FuseSvgIcon
							size={48}
							color="primary"
						>
							lucide:folder-open
						</FuseSvgIcon>
						<Typography className="text-2xl font-bold">Expedientes</Typography>
						<Typography color="text.secondary">La gestión de expedientes llega con la Fase 1 del prototipo.</Typography>
					</Paper>
				</div>
			}
		/>
	);
}

export default ExpedientesView;
