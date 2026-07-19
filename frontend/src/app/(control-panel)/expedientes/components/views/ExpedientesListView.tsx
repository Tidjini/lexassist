import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import InitialsAvatar from '@/components/InitialsAvatar';
import IconBadge from '@/components/IconBadge';
import { ACCENTS, DATAGRID_CARD_SX, DATAGRID_SX } from '@/configs/designTokens';
import useDebounce from '@fuse/hooks/useDebounce';
import { useCliente } from '../../../clientes/api/hooks/useClientes';
import { useExpedientes } from '../../api/hooks/useExpedientes';
import { ESTADOS, estadoInfo, type EstadoExpediente, type Expediente } from '../../api/types';
import ExpedienteFormDialog from '../forms/ExpedienteFormDialog';

const PAGE_SIZE = 25;

function ExpedientesListView() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [searchParams] = useSearchParams();
	const clienteFiltro = searchParams.get('cliente');
	const [rechercheInput, setRechercheInput] = useState('');
	const [recherche, setRecherche] = useState('');
	const [estado, setEstado] = useState<EstadoExpediente | ''>(
		(searchParams.get('estado') as EstadoExpediente | null) ?? ''
	);
	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
		page: 0,
		pageSize: PAGE_SIZE
	});
	const [dialogOpen, setDialogOpen] = useState(false);

	// Arrivé depuis la fiche d'un client (bouton "Expedientes (n)") : le champ Cliente
	// du formulaire de création doit être déjà rempli, pas redemandé à chercher.
	const { data: clienteDelFiltro } = useCliente(clienteFiltro ?? undefined);
	const clienteFijo =
		clienteFiltro && clienteDelFiltro
			? { id: clienteDelFiltro.id, label: `${clienteDelFiltro.prenom} ${clienteDelFiltro.nom}` }
			: null;

	const appliquerRecherche = useDebounce((valeur: string) => {
		setRecherche(valeur);
		setPaginationModel((prev) => ({ ...prev, page: 0 }));
	}, 300);

	const { data, isLoading } = useExpedientes({
		search: recherche || undefined,
		statut: estado || undefined,
		cliente: clienteFiltro ? Number(clienteFiltro) : undefined,
		page: paginationModel.page + 1
	});

	const expedientes = data?.results ?? [];
	const total = data?.count ?? 0;
	const sinExpedientes = !isLoading && total === 0 && !recherche && !estado;

	const columns: GridColDef<Expediente>[] = [
		{
			field: 'titre',
			headerName: t('expedientes.columnaExpediente'),
			flex: 1.2,
			renderCell: (params) => (
				<div className="flex h-full items-center gap-2.5">
					<IconBadge
						icono="lucide:folder-open"
						accent={ACCENTS.expedientes}
					/>
					<Typography
						variant="body2"
						className="font-medium"
					>
						{params.value}
					</Typography>
				</div>
			)
		},
		{
			field: 'cliente_nom_complet',
			headerName: t('expedientes.columnaCliente'),
			flex: 1,
			renderCell: (params) => (
				<div className="flex h-full items-center gap-2">
					<InitialsAvatar
						nombre={params.value as string}
						accent={ACCENTS.clientes}
						size={28}
					/>
					<Typography variant="body2">{params.value}</Typography>
				</div>
			)
		},
		{
			field: 'type_procedure',
			headerName: t('expedientes.columnaTramite'),
			flex: 0.8,
			renderCell: (params) => params.value || <span className="text-text-disabled">—</span>
		},
		{
			field: 'statut',
			headerName: t('expedientes.columnaEstado'),
			flex: 0.8,
			renderCell: (params) => {
				const info = estadoInfo(params.value as EstadoExpediente);
				return (
					<Chip
						size="small"
						label={info && t(info.labelKey)}
						color={info?.color}
					/>
				);
			}
		},
		{ field: 'date_ouverture', headerName: t('expedientes.columnaAbierto'), flex: 0.6 }
	];

	return (
		<>
			<FusePageSimple
				header={
					<div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<Typography
								variant="h4"
								className="font-bold"
							>
								{t('expedientes.tituloPagina')}
							</Typography>
							<Typography color="text.secondary">{t('expedientes.subtituloPagina')}</Typography>
						</div>
						<Button
							variant="contained"
							color="primary"
							startIcon={<FuseSvgIcon>lucide:plus</FuseSvgIcon>}
							onClick={() => setDialogOpen(true)}
						>
							{t('expedientes.nuevoExpediente')}
						</Button>
					</div>
				}
				content={
					<div className="p-6">
						<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
							<TextField
								value={rechercheInput}
								onChange={(e) => {
									setRechercheInput(e.target.value);
									appliquerRecherche(e.target.value);
								}}
								placeholder={t('expedientes.buscarPlaceholder')}
								size="small"
								className="w-full sm:max-w-xs"
								slotProps={{
									input: {
										startAdornment: (
											<InputAdornment position="start">
												<FuseSvgIcon
													size={18}
													color="disabled"
												>
													lucide:search
												</FuseSvgIcon>
											</InputAdornment>
										)
									}
								}}
							/>
							<TextField
								select
								size="small"
								label={t('expedientes.filtroEstado')}
								value={estado}
								onChange={(e) => {
									setEstado(e.target.value as EstadoExpediente | '');
									setPaginationModel((prev) => ({ ...prev, page: 0 }));
								}}
								className="w-full sm:w-48"
							>
								<MenuItem value="">
									<em>{t('expedientes.filtroTodos')}</em>
								</MenuItem>
								{ESTADOS.map((e) => (
									<MenuItem
										key={e.value}
										value={e.value}
									>
										{t(e.labelKey)}
									</MenuItem>
								))}
							</TextField>
						</div>

						{sinExpedientes ? (
							<EmptyState
								icone="lucide:folder-open"
								titre={t('expedientes.emptyTitulo')}
								description={t('expedientes.emptyDescripcion')}
								accent={ACCENTS.expedientes}
								action={{ label: t('expedientes.emptyAccion'), onClick: () => setDialogOpen(true) }}
							/>
						) : (
							<Paper sx={DATAGRID_CARD_SX}>
								<DataGrid
									rows={expedientes}
									columns={columns}
									loading={isLoading}
									paginationMode="server"
									rowCount={total}
									paginationModel={paginationModel}
									onPaginationModelChange={setPaginationModel}
									pageSizeOptions={[PAGE_SIZE]}
									disableRowSelectionOnClick
									onRowClick={(params) => navigate(`/expedientes/${params.id}`)}
									autoHeight
									sx={{ ...DATAGRID_SX, cursor: 'pointer' }}
								/>
							</Paper>
						)}
					</div>
				}
			/>

			<ExpedienteFormDialog
				open={dialogOpen}
				clienteFijo={clienteFijo}
				onClose={() => setDialogOpen(false)}
				onCreated={(expediente) => navigate(`/expedientes/${expediente.id}`)}
			/>
		</>
	);
}

export default ExpedientesListView;
