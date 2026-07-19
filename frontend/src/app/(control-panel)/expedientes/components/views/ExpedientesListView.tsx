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
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import EmptyState from '@/components/EmptyState';
import { ACCENTS } from '@/configs/designTokens';
import useDebounce from '@fuse/hooks/useDebounce';
import { useExpedientes } from '../../api/hooks/useExpedientes';
import { ESTADOS, estadoInfo, type EstadoExpediente, type Expediente } from '../../api/types';
import ExpedienteFormDialog from '../forms/ExpedienteFormDialog';

const PAGE_SIZE = 25;

function ExpedientesListView() {
	const navigate = useNavigate();
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
		{ field: 'titre', headerName: 'Expediente', flex: 1.2 },
		{ field: 'cliente_nom_complet', headerName: 'Cliente', flex: 1 },
		{ field: 'type_procedure', headerName: 'Trámite', flex: 0.8 },
		{
			field: 'statut',
			headerName: 'Estado',
			flex: 0.8,
			renderCell: (params) => (
				<Chip
					size="small"
					label={estadoInfo(params.value as EstadoExpediente)?.label}
					color={estadoInfo(params.value as EstadoExpediente)?.color}
				/>
			)
		},
		{ field: 'date_ouverture', headerName: 'Abierto', flex: 0.6 }
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
								Expedientes
							</Typography>
							<Typography color="text.secondary">Trámites por cliente, con su estado</Typography>
						</div>
						<Button
							variant="contained"
							color="primary"
							startIcon={<FuseSvgIcon>lucide:plus</FuseSvgIcon>}
							onClick={() => setDialogOpen(true)}
						>
							Nuevo expediente
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
								placeholder="Buscar por título, cliente…"
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
								label="Estado"
								value={estado}
								onChange={(e) => {
									setEstado(e.target.value as EstadoExpediente | '');
									setPaginationModel((prev) => ({ ...prev, page: 0 }));
								}}
								className="w-full sm:w-48"
							>
								<MenuItem value="">
									<em>Todos</em>
								</MenuItem>
								{ESTADOS.map((e) => (
									<MenuItem
										key={e.value}
										value={e.value}
									>
										{e.label}
									</MenuItem>
								))}
							</TextField>
						</div>

						{sinExpedientes ? (
							<EmptyState
								icone="lucide:folder-open"
								titre="Todavía no hay expedientes"
								description="Cree el primer expediente para empezar a seguir un trámite."
								accent={ACCENTS.expedientes}
								action={{ label: 'Crear el primer expediente', onClick: () => setDialogOpen(true) }}
							/>
						) : (
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
								sx={{ cursor: 'pointer' }}
							/>
						)}
					</div>
				}
			/>

			<ExpedienteFormDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onCreated={(expediente) => navigate(`/expedientes/${expediente.id}`)}
			/>
		</>
	);
}

export default ExpedientesListView;
