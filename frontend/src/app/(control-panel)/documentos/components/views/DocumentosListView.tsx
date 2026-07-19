import { useState } from 'react';
import { useSearchParams } from 'react-router';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import { ACCENTS } from '@/configs/designTokens';
import { useDeleteDocumento, useDocumentos } from '../../api/hooks/useDocumentos';
import { CATEGORIAS, categoriaLabelKey, type CategoriaDocumento, type Documento } from '../../api/types';
import DocumentoUploadDialog from '../forms/DocumentoUploadDialog';
import DocumentoPreviewDialog from './DocumentoPreviewDialog';

const PAGE_SIZE = 25;

function formatearTamano(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;

	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;

	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentosListView() {
	const { t, i18n } = useTranslation();
	const { enqueueSnackbar } = useSnackbar();
	const [searchParams] = useSearchParams();
	const clienteFiltro = searchParams.get('cliente');
	const dossierFiltro = searchParams.get('dossier');
	const [categoria, setCategoria] = useState<CategoriaDocumento | ''>('');
	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
		page: 0,
		pageSize: PAGE_SIZE
	});
	const [dialogOpen, setDialogOpen] = useState(false);
	const [previewDocumento, setPreviewDocumento] = useState<Documento | null>(null);

	const { data, isLoading } = useDocumentos({
		cliente: clienteFiltro ? Number(clienteFiltro) : undefined,
		dossier: dossierFiltro ? Number(dossierFiltro) : undefined,
		categorie: categoria || undefined,
		page: paginationModel.page + 1
	});

	const deleteMutation = useDeleteDocumento();
	const documentos = data?.results ?? [];
	const total = data?.count ?? 0;
	const sinDocumentos = !isLoading && total === 0 && !categoria;

	async function eliminar(documento: Documento) {
		if (!window.confirm(t('documentos.confirmarEliminar', { nombre: documento.nom_original }))) return;

		try {
			await deleteMutation.mutateAsync(documento.id);
			enqueueSnackbar(t('documentos.eliminado'), { variant: 'success' });
		} catch {
			enqueueSnackbar(t('documentos.errorEliminar'), { variant: 'error' });
		}
	}

	const columns: GridColDef<Documento>[] = [
		{ field: 'nom_original', headerName: t('documentos.columnaArchivo'), flex: 1.2 },
		{
			field: 'categorie',
			headerName: t('documentos.columnaCategoria'),
			flex: 0.8,
			valueGetter: (value: CategoriaDocumento) => t(categoriaLabelKey(value))
		},
		{
			field: 'taille',
			headerName: t('documentos.columnaTamano'),
			flex: 0.5,
			valueGetter: (value: number) => formatearTamano(value)
		},
		{
			field: 'created_at',
			headerName: t('documentos.columnaSubido'),
			flex: 0.6,
			valueGetter: (value: string) =>
				new Date(value).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'es-ES')
		},
		{
			field: 'acciones',
			headerName: '',
			flex: 0.4,
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
					<div className="flex items-center justify-between p-6">
						<div>
							<Typography
								variant="h4"
								className="font-bold"
							>
								{t('documentos.tituloPagina')}
							</Typography>
							<Typography color="text.secondary">{t('documentos.subtituloPagina')}</Typography>
						</div>
						<Button
							variant="contained"
							color="primary"
							startIcon={<FuseSvgIcon>lucide:upload</FuseSvgIcon>}
							onClick={() => setDialogOpen(true)}
						>
							{t('documentos.subirDocumento')}
						</Button>
					</div>
				}
				content={
					<div className="p-6">
						<TextField
							select
							size="small"
							label={t('documentos.filtroCategoria')}
							value={categoria}
							onChange={(e) => {
								setCategoria(e.target.value as CategoriaDocumento | '');
								setPaginationModel((prev) => ({ ...prev, page: 0 }));
							}}
							className="mb-4 w-full max-w-xs"
						>
							<MenuItem value="">
								<em>{t('documentos.filtroTodas')}</em>
							</MenuItem>
							{CATEGORIAS.map((c) => (
								<MenuItem
									key={c.value}
									value={c.value}
								>
									{t(c.labelKey)}
								</MenuItem>
							))}
						</TextField>

						{sinDocumentos ? (
							<EmptyState
								icone="lucide:file-text"
								titre={t('documentos.emptyTitulo')}
								description={t('documentos.emptyDescripcion')}
								accent={ACCENTS.documentos}
								action={{ label: t('documentos.emptyAccion'), onClick: () => setDialogOpen(true) }}
							/>
						) : (
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
								sx={{ cursor: 'pointer' }}
							/>
						)}
					</div>
				}
			/>

			<DocumentoUploadDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
			/>

			<DocumentoPreviewDialog
				documento={previewDocumento}
				onClose={() => setPreviewDocumento(null)}
			/>
		</>
	);
}

export default DocumentosListView;
