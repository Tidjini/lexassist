import { useState } from 'react';
import { useNavigate } from 'react-router';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import InitialsAvatar from '@/components/InitialsAvatar';
import { ACCENTS, DATAGRID_CARD_SX, DATAGRID_SX } from '@/configs/designTokens';
import useDebounce from '@fuse/hooks/useDebounce';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import { useClientes, useDeleteCliente } from '../../api/hooks/useClientes';
import type { Cliente } from '../../api/types';
import ClienteFormDialog from '../forms/ClienteFormDialog';

const PAGE_SIZE = 25;

function ClientesListView() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { enqueueSnackbar } = useSnackbar();
	const [rechercheInput, setRechercheInput] = useState('');
	const [recherche, setRecherche] = useState('');
	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
		page: 0,
		pageSize: PAGE_SIZE
	});
	const [dialogOpen, setDialogOpen] = useState(false);
	const esMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('sm'));

	const appliquerRecherche = useDebounce((valeur: string) => {
		setRecherche(valeur);
		setPaginationModel((prev) => ({ ...prev, page: 0 }));
	}, 300);

	const { data, isLoading } = useClientes({
		search: recherche || undefined,
		page: paginationModel.page + 1
	});

	const deleteMutation = useDeleteCliente();

	const clientes = data?.results ?? [];
	const total = data?.count ?? 0;
	const sinClientes = !isLoading && total === 0 && !recherche;

	function abrirCreacion() {
		setDialogOpen(true);
	}

	async function eliminar(cliente: Cliente) {
		if (!window.confirm(t('clientes.confirmarEliminar', { nombre: `${cliente.prenom} ${cliente.nom}` }))) return;

		try {
			await deleteMutation.mutateAsync(cliente.id);
			enqueueSnackbar(t('clientes.eliminado'), { variant: 'success' });
		} catch {
			enqueueSnackbar(t('clientes.errorEliminar'), { variant: 'error' });
		}
	}

	const columns: GridColDef<Cliente>[] = [
		{
			field: 'nombre_completo',
			headerName: t('clientes.columnaCliente'),
			flex: 1.2,
			valueGetter: (_value, row) => `${row.prenom} ${row.nom}`,
			renderCell: (params) => (
				<div className="flex h-full items-center gap-2.5">
					<InitialsAvatar
						nombre={params.value as string}
						accent={ACCENTS.clientes}
						size={32}
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
			field: 'email',
			headerName: t('clientes.columnaEmail'),
			flex: 1,
			renderCell: (params) => params.value || <span className="text-text-disabled">—</span>
		},
		{
			field: 'telephone',
			headerName: t('clientes.columnaTelefono'),
			flex: 0.8,
			renderCell: (params) => params.value || <span className="text-text-disabled">—</span>
		},
		{ field: 'numero_nie', headerName: t('clientes.columnaNie'), flex: 0.7 },
		{ field: 'nb_dossiers', headerName: t('clientes.columnaExpedientes'), flex: 0.6, type: 'number' },
		{
			field: 'actif',
			headerName: t('clientes.columnaEstado'),
			flex: 0.7,
			renderCell: (params) => (
				<Chip
					size="small"
					label={params.value ? t('clientes.estadoActivo') : t('clientes.estadoInactivo')}
					color={params.value ? 'success' : 'default'}
					variant="outlined"
				/>
			)
		},
		{
			field: 'acciones',
			headerName: '',
			flex: 0.5,
			sortable: false,
			renderCell: (params) => (
				<IconButton
					size="small"
					color="error"
					onClick={(e) => {
						e.stopPropagation();
						eliminar(params.row);
					}}
				>
					<FuseSvgIcon size={18}>lucide:trash-2</FuseSvgIcon>
				</IconButton>
			)
		}
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
								{t('clientes.tituloPagina')}
							</Typography>
							<Typography color="text.secondary">{t('clientes.subtituloPagina')}</Typography>
						</div>
						<Button
							variant="contained"
							color="primary"
							startIcon={<FuseSvgIcon>lucide:plus</FuseSvgIcon>}
							onClick={abrirCreacion}
						>
							{t('clientes.nuevoCliente')}
						</Button>
					</div>
				}
				content={
					<div className="p-6">
						<TextField
							value={rechercheInput}
							onChange={(e) => {
								setRechercheInput(e.target.value);
								appliquerRecherche(e.target.value);
							}}
							placeholder={t('clientes.buscarPlaceholder')}
							size="small"
							className="mb-4 w-full max-w-xs"
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

						{sinClientes ? (
							<EmptyState
								icone="lucide:users"
								titre={t('clientes.emptyTitulo')}
								description={t('clientes.emptyDescripcion')}
								accent={ACCENTS.clientes}
								action={{ label: t('clientes.emptyAccion'), onClick: abrirCreacion }}
							/>
						) : (
							<Paper sx={DATAGRID_CARD_SX}>
								<DataGrid
									rows={clientes}
									columns={columns}
									loading={isLoading}
									paginationMode="server"
									rowCount={total}
									paginationModel={paginationModel}
									onPaginationModelChange={setPaginationModel}
									pageSizeOptions={[PAGE_SIZE]}
									disableRowSelectionOnClick
									onRowClick={(params) => navigate(`/clientes/${params.id}`)}
									autoHeight
									columnVisibilityModel={
										esMobile
											? { email: false, telephone: false, numero_nie: false, nb_dossiers: false }
											: undefined
									}
									sx={{ ...DATAGRID_SX, cursor: 'pointer' }}
								/>
							</Paper>
						)}
					</div>
				}
			/>

			<ClienteFormDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onCreated={(cliente) => navigate(`/clientes/${cliente.id}`)}
			/>
		</>
	);
}

export default ClientesListView;
