import { useState } from 'react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import { ACCENTS, DATAGRID_CARD_SX, DATAGRID_SX } from '@/configs/designTokens';
import { useDocumentos } from '../../../documentos/api/hooks/useDocumentos';
import { estadoIaInfo, type Documento, type EstadoIA } from '../../../documentos/api/types';
import DocumentoUploadDialog from '../../../documentos/components/forms/DocumentoUploadDialog';
import DocumentoPreviewDialog from '../../../documentos/components/views/DocumentoPreviewDialog';

const PAGE_SIZE = 10;

type ClienteDocumentosTabProps = {
	clienteId: number;
	clienteLabel: string;
};

function ClienteDocumentosTab({ clienteId, clienteLabel }: ClienteDocumentosTabProps) {
	const { t } = useTranslation();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [previewDocumento, setPreviewDocumento] = useState<Documento | null>(null);
	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: PAGE_SIZE });

	const { data, isLoading } = useDocumentos({ cliente: clienteId, page: paginationModel.page + 1 });
	const documentos = data?.results ?? [];
	const total = data?.count ?? 0;

	const columns: GridColDef<Documento>[] = [
		{
			field: 'nom_original',
			headerName: t('documentos.columnaArchivo'),
			flex: 1.2,
			renderCell: (params) => (
				<div className="flex h-full items-center gap-2.5">
					<div
						className="flex items-center justify-center rounded-lg"
						style={{ width: 32, height: 32, backgroundColor: `${ACCENTS.documentos}29` }}
					>
						<FuseSvgIcon
							size={16}
							style={{ color: ACCENTS.documentos }}
						>
							lucide:file-text
						</FuseSvgIcon>
					</div>
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
			field: 'estado_ia',
			headerName: t('documentos.columnaIa'),
			flex: 0.7,
			renderCell: (params) => {
				const info = estadoIaInfo(params.value as EstadoIA);
				return (
					<Chip
						size="small"
						label={info && t(info.labelKey)}
						color={info?.color}
					/>
				);
			}
		},
		{
			field: 'created_at',
			headerName: t('documentos.columnaSubido'),
			flex: 0.6,
			valueGetter: (value: string) => new Date(value).toLocaleDateString()
		}
	];

	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Button
					variant="contained"
					startIcon={<FuseSvgIcon size={18}>lucide:upload</FuseSvgIcon>}
					onClick={() => setDialogOpen(true)}
				>
					{t('documentos.subirDocumento')}
				</Button>
			</div>

			{!isLoading && total === 0 ? (
				<EmptyState
					icone="lucide:file-text"
					titre={t('documentos.emptyTitulo')}
					description={t('documentos.emptyDescripcion')}
					accent={ACCENTS.documentos}
					action={{ label: t('documentos.emptyAccion'), onClick: () => setDialogOpen(true) }}
				/>
			) : (
				<Paper sx={DATAGRID_CARD_SX}>
					<DataGrid
						rows={documentos}
						columns={columns}
						loading={isLoading}
						paginationMode="server"
						rowCount={total}
						paginationModel={paginationModel}
						onPaginationModelChange={setPaginationModel}
						pageSizeOptions={[PAGE_SIZE]}
						disableRowSelectionOnClick
						onRowClick={(params) => setPreviewDocumento(params.row)}
						autoHeight
						hideFooter={total <= PAGE_SIZE}
						sx={{ ...DATAGRID_SX, cursor: 'pointer' }}
					/>
				</Paper>
			)}

			<DocumentoUploadDialog
				open={dialogOpen}
				clienteFijo={{ id: clienteId, label: clienteLabel }}
				onClose={() => setDialogOpen(false)}
			/>

			<DocumentoPreviewDialog
				documento={previewDocumento}
				onClose={() => setPreviewDocumento(null)}
			/>
		</div>
	);
}

export default ClienteDocumentosTab;
