import { useState } from 'react';
import { useNavigate } from 'react-router';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import { ACCENTS, DATAGRID_CARD_SX, DATAGRID_SX } from '@/configs/designTokens';
import { useExpedientes } from '../../../expedientes/api/hooks/useExpedientes';
import { estadoInfo, type EstadoExpediente, type Expediente } from '../../../expedientes/api/types';
import ExpedienteFormDialog from '../../../expedientes/components/forms/ExpedienteFormDialog';

const PAGE_SIZE = 10;

type ClienteExpedientesTabProps = {
	clienteId: number;
	clienteLabel: string;
};

function ClienteExpedientesTab({ clienteId, clienteLabel }: ClienteExpedientesTabProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: PAGE_SIZE });

	const { data, isLoading } = useExpedientes({ cliente: clienteId, page: paginationModel.page + 1 });
	const expedientes = data?.results ?? [];
	const total = data?.count ?? 0;

	const columns: GridColDef<Expediente>[] = [
		{ field: 'titre', headerName: t('expedientes.columnaExpediente'), flex: 1.2 },
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
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Button
					variant="contained"
					startIcon={<FuseSvgIcon size={18}>lucide:plus</FuseSvgIcon>}
					onClick={() => setDialogOpen(true)}
				>
					{t('expedientes.nuevoExpediente')}
				</Button>
			</div>

			{!isLoading && total === 0 ? (
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
						hideFooter={total <= PAGE_SIZE}
						sx={{ ...DATAGRID_SX, cursor: 'pointer' }}
					/>
				</Paper>
			)}

			<ExpedienteFormDialog
				open={dialogOpen}
				clienteFijo={{ id: clienteId, label: clienteLabel }}
				onClose={() => setDialogOpen(false)}
				onCreated={(expediente) => navigate(`/expedientes/${expediente.id}`)}
			/>
		</div>
	);
}

export default ClienteExpedientesTab;
