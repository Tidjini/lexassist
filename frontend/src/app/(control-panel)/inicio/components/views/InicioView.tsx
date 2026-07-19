import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import useUser from '@auth/useUser';
import { useClientes } from '../../../clientes/api/hooks/useClientes';
import { useExpedientes } from '../../../expedientes/api/hooks/useExpedientes';
import { useAlertas, useDocumentos } from '../../../documentos/api/hooks/useDocumentos';

/**
 * Tableau de bord du cabinet — tuiles de navigation avec compteurs réels.
 */
function InicioView() {
	const { data: user } = useUser();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const { data: clientesData, isLoading: clientesLoading } = useClientes({ actif: true, page: 1 });
	const { data: expedientesData, isLoading: expedientesLoading } = useExpedientes({ page: 1 });
	const { data: documentosData, isLoading: documentosLoading } = useDocumentos({ page: 1 });
	const { data: requerimientosData, isLoading: requerimientosLoading } = useExpedientes({
		statut: 'REQUERIMIENTO',
		page: 1
	});
	const { data: alertasData, isLoading: alertasLoading } = useAlertas();

	const tiles = [
		{
			icon: 'lucide:users',
			title: t('clientes.tituloPagina'),
			description: t('inicio.clientesDesc'),
			url: '/clientes',
			cuenta: clientesData?.count,
			cargando: clientesLoading
		},
		{
			icon: 'lucide:folder-open',
			title: t('expedientes.tituloPagina'),
			description: t('inicio.expedientesDesc'),
			url: '/expedientes',
			cuenta: expedientesData?.count,
			cargando: expedientesLoading
		},
		{
			icon: 'lucide:file-text',
			title: t('documentos.tituloPagina'),
			description: t('inicio.documentosDesc'),
			url: '/documentos',
			cuenta: documentosData?.count,
			cargando: documentosLoading
		},
		{
			icon: 'lucide:bell',
			title: t('inicio.requerimientosTitulo'),
			description: t('inicio.requerimientosDesc'),
			url: '/expedientes?estado=REQUERIMIENTO',
			cuenta: requerimientosData?.count,
			cargando: requerimientosLoading
		},
		{
			icon: 'lucide:calendar-clock',
			title: t('inicio.alertasTitulo'),
			description: t('inicio.alertasDesc'),
			url: '/alertas',
			cuenta: alertasData?.length,
			cargando: alertasLoading
		}
	];

	return (
		<FusePageSimple
			content={
				<div className="flex w-full flex-col gap-8 p-6 md:p-10">
					<div>
						<Typography className="text-3xl leading-tight font-extrabold tracking-tight">
							{t('inicio.bienvenida', { nombre: user?.displayName })}
						</Typography>
						<Typography
							className="mt-1 text-lg"
							color="text.secondary"
						>
							{t('inicio.subtitulo')}
						</Typography>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{tiles.map((tile) => (
							<Paper
								key={tile.title}
								className="flex cursor-pointer flex-col gap-3 rounded-xl p-6 transition-shadow hover:shadow-md"
								onClick={() => navigate(tile.url)}
							>
								<div className="flex items-center justify-between">
									<FuseSvgIcon
										size={28}
										color="primary"
									>
										{tile.icon}
									</FuseSvgIcon>
									{tile.cargando ? (
										<Skeleton
											width={32}
											height={28}
										/>
									) : (
										<Typography className="text-2xl font-bold">{tile.cuenta ?? 0}</Typography>
									)}
								</div>
								<Typography className="text-lg font-semibold">{tile.title}</Typography>
								<Typography
									className="text-md"
									color="text.secondary"
								>
									{tile.description}
								</Typography>
							</Paper>
						))}
					</div>

					<Paper className="flex flex-col gap-2 rounded-xl p-6">
						<div className="flex items-center gap-3">
							<FuseSvgIcon
								size={22}
								color="primary"
							>
								lucide:sparkles
							</FuseSvgIcon>
							<Typography className="text-lg font-semibold">{t('inicio.faseTitulo')}</Typography>
							<Chip
								size="small"
								color="primary"
								label={t('inicio.faseChip')}
							/>
						</div>
						<Typography color="text.secondary">{t('inicio.faseDescripcion')}</Typography>
					</Paper>
				</div>
			}
		/>
	);
}

export default InicioView;
