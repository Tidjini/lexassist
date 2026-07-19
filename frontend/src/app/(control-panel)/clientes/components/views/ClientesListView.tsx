import { useState } from 'react';
import { useNavigate } from 'react-router';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import EmptyState from '@/components/EmptyState';
import { ACCENTS } from '@/configs/designTokens';
import useDebounce from '@fuse/hooks/useDebounce';
import { useClientes, useDeleteCliente } from '../../api/hooks/useClientes';
import type { Cliente } from '../../api/types';
import ClienteFormDialog from '../forms/ClienteFormDialog';

const PAGE_SIZE = 25;

function ClientesListView() {
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const [rechercheInput, setRechercheInput] = useState('');
	const [recherche, setRecherche] = useState('');
	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
		page: 0,
		pageSize: PAGE_SIZE
	});
	const [dialogOpen, setDialogOpen] = useState(false);

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
		if (!window.confirm(`¿Eliminar a ${cliente.prenom} ${cliente.nom}?`)) return;

		try {
			await deleteMutation.mutateAsync(cliente.id);
			enqueueSnackbar('Cliente eliminado', { variant: 'success' });
		} catch {
			enqueueSnackbar('No se pudo eliminar el cliente', { variant: 'error' });
		}
	}

	const columns: GridColDef<Cliente>[] = [
		{
			field: 'nombre_completo',
			headerName: 'Cliente',
			flex: 1.2,
			valueGetter: (_value, row) => `${row.prenom} ${row.nom}`
		},
		{ field: 'email', headerName: 'Email', flex: 1 },
		{ field: 'telephone', headerName: 'Teléfono', flex: 0.8 },
		{ field: 'numero_nie', headerName: 'NIE', flex: 0.7 },
		{ field: 'nb_dossiers', headerName: 'Expedientes', flex: 0.6, type: 'number' },
		{
			field: 'actif',
			headerName: 'Estado',
			flex: 0.6,
			valueGetter: (value: boolean) => (value ? 'Activo' : 'Inactivo')
		},
		{
			field: 'acciones',
			headerName: '',
			flex: 0.5,
			sortable: false,
			renderCell: (params) => (
				<Button
					size="small"
					color="error"
					onClick={(e) => {
						e.stopPropagation();
						eliminar(params.row);
					}}
				>
					Eliminar
				</Button>
			)
		}
	];

	return (
		<>
			<FusePageSimple
				header={
					<div className="flex items-center justify-between p-6">
						<div>
							<Typography
								variant="h4"
								className="font-bold"
							>
								Clientes
							</Typography>
							<Typography color="text.secondary">La «maleta de datos» de cada cliente</Typography>
						</div>
						<Button
							variant="contained"
							color="primary"
							startIcon={<FuseSvgIcon>lucide:plus</FuseSvgIcon>}
							onClick={abrirCreacion}
						>
							Nuevo cliente
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
							placeholder="Buscar por nombre, email, NIE…"
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
								titre="Todavía no hay clientes"
								description="Añada su primer cliente para empezar."
								accent={ACCENTS.clientes}
								action={{ label: 'Añadir el primer cliente', onClick: abrirCreacion }}
							/>
						) : (
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
								sx={{ cursor: 'pointer' }}
							/>
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
