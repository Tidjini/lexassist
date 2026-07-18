import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

/**
 * Placeholder — module en construction (Phase 1).
 */
function DocumentosView() {
	return (
		<FusePageSimple
			content={
				<div className="flex w-full flex-col p-6 md:p-10">
					<Paper className="flex flex-col items-center gap-4 rounded-xl p-12 text-center">
						<FuseSvgIcon
							size={48}
							color="primary"
						>
							lucide:file-text
						</FuseSvgIcon>
						<Typography className="text-2xl font-bold">Documentos</Typography>
						<Typography color="text.secondary">La subida y clasificación de documentos llega con la Fase 1 del prototipo.</Typography>
					</Paper>
				</div>
			}
		/>
	);
}

export default DocumentosView;
