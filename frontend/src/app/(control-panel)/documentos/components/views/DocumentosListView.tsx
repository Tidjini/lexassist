import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import { DataGrid, type GridColDef, type GridPaginationModel } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import InitialsAvatar from '@/components/InitialsAvatar';
import { ACCENTS, DATAGRID_CARD_SX, DATAGRID_SX } from '@/configs/designTokens';
import useThemeMediaQuery from '@fuse/hooks/useThemeMediaQuery';
import { useCliente } from '../../../clientes/api/hooks/useClientes';
import { useDeleteDocumento, useDocumentos } from '../../api/hooks/useDocumentos';
import {
	CATEGORIAS,
	categoriaLabelKey,
	estadoIaInfo,
	type CategoriaDocumento,
	type Documento,
	type EstadoIA
} from '../../api/types';
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
	const navigate = useNavigate();
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
	const esMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('sm'));

	// Arrivé depuis la fiche d'un client (bouton "Documentos (n)") : le champ Cliente
	// du formulaire d'upload doit être déjà rempli, pas redemandé à chercher.
	const { data: clienteDelFiltro } = useCliente(clienteFiltro ?? undefined);
	const clienteFijo =
		clienteFiltro && clienteDelFiltro
			? { id: clienteDelFiltro.id, label: `${clienteDelFiltro.prenom} ${clienteDelFiltro.nom}` }
			: null;

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
			field: 'cliente_nom_complet',
			headerName: t('clientes.columnaCliente'),
			flex: 1,
			renderCell: (params) => (
				<div className="flex h-full items-center gap-1.5">
					{params.row.cliente !== null && (
						<InitialsAvatar
							nombre={params.value as string}
							accent={ACCENTS.clientes}
							size={28}
						/>
					)}
					<Typography variant="body2">
						{params.row.cliente === null ? t('documentos.sinAsignar') : params.value}
					</Typography>
					{params.row.cliente !== null && !params.row.cliente_confirmado && (
						<Chip
							size="small"
							color="warning"
							label={t('documentos.porConfirmar')}
						/>
					)}
				</div>
			)
		},
		{
			field: 'categorie',
			headerName: t('documentos.columnaCategoria'),
			flex: 0.8,
			valueGetter: (value: CategoriaDocumento) => t(categoriaLabelKey(value))
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
					<div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<Typography
								variant="h4"
								className="font-bold"
							>
								{t('documentos.tituloPagina')}
							</Typography>
							<Typography color="text.secondary">{t('documentos.subtituloPagina')}</Typography>
						</div>
						<div className="flex flex-col gap-2 sm:flex-row">
							<Button
								variant="outlined"
								startIcon={<FuseSvgIcon size={18}>lucide:upload-cloud</FuseSvgIcon>}
								onClick={() => navigate('/documentos/importar')}
							>
								{t('documentos.importacionMasiva')}
							</Button>
							<Button
								variant="contained"
								color="primary"
								startIcon={<FuseSvgIcon>lucide:upload</FuseSvgIcon>}
								onClick={() => setDialogOpen(true)}
							>
								{t('documentos.subirDocumento')}
							</Button>
						</div>
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
									columnVisibilityModel={esMobile ? { taille: false, created_at: false } : undefined}
									sx={{ ...DATAGRID_SX, cursor: 'pointer' }}
								/>
							</Paper>
						)}
					</div>
				}
			/>

			<DocumentoUploadDialog
				open={dialogOpen}
				clienteFijo={clienteFijo}
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
