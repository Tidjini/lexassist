import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import { useNavigate } from 'react-router';
import useUser from '@auth/useUser';
import { useClientes } from '../../../clientes/api/hooks/useClientes';
import { useExpedientes } from '../../../expedientes/api/hooks/useExpedientes';
import { useDocumentos } from '../../../documentos/api/hooks/useDocumentos';

/**
 * Tableau de bord du cabinet — Phase 1 : tuiles de navigation avec compteurs
 * réels ; les alertes d'expiration (passeport, NIE) arrivent en Phase 2/3.
 */
function InicioView() {
	const { data: user } = useUser();
	const navigate = useNavigate();

	const { data: clientesData, isLoading: clientesLoading } = useClientes({ actif: true, page: 1 });
	const { data: expedientesData, isLoading: expedientesLoading } = useExpedientes({ page: 1 });
	const { data: documentosData, isLoading: documentosLoading } = useDocumentos({ page: 1 });
	const { data: requerimientosData, isLoading: requerimientosLoading } = useExpedientes({
		statut: 'REQUERIMIENTO',
		page: 1
	});

	const tiles = [
		{
			icon: 'lucide:users',
			title: 'Clientes',
			description: 'La «maleta de datos» de cada cliente, construida automáticamente por la IA.',
			url: '/clientes',
			cuenta: clientesData?.count,
			cargando: clientesLoading
		},
		{
			icon: 'lucide:folder-open',
			title: 'Expedientes',
			description: 'Expedientes por trámite con estados: en preparación, presentado, requerido, resuelto.',
			url: '/expedientes',
			cuenta: expedientesData?.count,
			cargando: expedientesLoading
		},
		{
			icon: 'lucide:file-text',
			title: 'Documentos',
			description: 'Suba una foto: la IA clasifica el documento, extrae los datos y lo archiva.',
			url: '/documentos',
			cuenta: documentosData?.count,
			cargando: documentosLoading
		},
		{
			icon: 'lucide:bell',
			title: 'Requerimientos abiertos',
			description: 'Expedientes en estado de requerimiento, a la espera de una respuesta.',
			url: '/expedientes?estado=REQUERIMIENTO',
			cuenta: requerimientosData?.count,
			cargando: requerimientosLoading
		}
	];

	return (
		<FusePageSimple
			content={
				<div className="flex w-full flex-col gap-8 p-6 md:p-10">
					<div>
						<Typography className="text-3xl leading-tight font-extrabold tracking-tight">
							Bienvenida, {user?.displayName}
						</Typography>
						<Typography
							className="mt-1 text-lg"
							color="text.secondary"
						>
							Su despacho de un vistazo — LexAssist
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
							<Typography className="text-lg font-semibold">Fase 1 — Prototipo</Typography>
							<Chip
								size="small"
								color="primary"
								label="en curso"
							/>
						</div>
						<Typography color="text.secondary">
							Gestión de clientes y expedientes, subida de documentos y diseño adaptado al móvil. Las
							siguientes fases añadirán el escaneo inteligente con IA, los checklists por trámite y la
							generación automática de formularios oficiales (modelos EX, tasas 790).
						</Typography>
					</Paper>
				</div>
			}
		/>
	);
}

export default InicioView;
