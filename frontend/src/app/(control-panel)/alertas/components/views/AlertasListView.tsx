import { useNavigate } from 'react-router';
import FusePageSimple from '@fuse/core/FusePageSimple';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import EmptyState from '@/components/EmptyState';
import { ACCENTS } from '@/configs/designTokens';
import ListSkeleton from '@/components/ListSkeleton';
import { useAlertas } from '../../../documentos/api/hooks/useDocumentos';
import { categoriaLabelKey, type AlertaDocumento } from '../../../documentos/api/types';

function AlertasListView() {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const { data, isLoading } = useAlertas();
	const alertas = data ?? [];

	function textoDiasRestantes(dias: number) {
		if (dias < 0) return t('alertas.expirado', { dias: Math.abs(dias) });

		if (dias === 0) return t('alertas.expiraHoy');

		return t('alertas.expiraEn', { dias });
	}

	function colorDiasRestantes(dias: number): 'error' | 'warning' | 'default' {
		if (dias < 0) return 'error';

		if (dias <= 30) return 'warning';

		return 'default';
	}

	const columns: GridColDef<AlertaDocumento>[] = [
		{ field: 'nom_original', headerName: t('alertas.columnaDocumento'), flex: 1.2 },
		{ field: 'cliente_nom_complet', headerName: t('alertas.columnaCliente'), flex: 1 },
		{
			field: 'categorie',
			headerName: t('alertas.columnaCategoria'),
			flex: 0.8,
			valueGetter: (value: AlertaDocumento['categorie']) => t(categoriaLabelKey(value))
		},
		{
			field: 'fecha_expiracion',
			headerName: t('alertas.columnaExpira'),
			flex: 1,
			renderCell: (params) => (
				<div className="flex items-center gap-2">
					<Typography variant="body2">
						{new Date(params.row.fecha_expiracion).toLocaleDateString(
							i18n.language === 'fr' ? 'fr-FR' : 'es-ES'
						)}
					</Typography>
					<Chip
						size="small"
						color={colorDiasRestantes(params.row.dias_restantes)}
						label={textoDiasRestantes(params.row.dias_restantes)}
					/>
				</div>
			)
		}
	];

	return (
		<FusePageSimple
			header={
				<div className="p-6">
					<Typography
						variant="h4"
						className="font-bold"
					>
						{t('alertas.tituloPagina')}
					</Typography>
					<Typography color="text.secondary">{t('alertas.subtituloPagina')}</Typography>
				</div>
			}
			content={
				<div className="p-6">
					{isLoading && <ListSkeleton />}

					{!isLoading && alertas.length === 0 && (
						<EmptyState
							icone="lucide:bell"
							titre={t('alertas.emptyTitulo')}
							description={t('alertas.emptyDescripcion')}
							accent={ACCENTS.inicio}
						/>
					)}

					{!isLoading && alertas.length > 0 && (
						<DataGrid
							rows={alertas}
							columns={columns}
							disableRowSelectionOnClick
							onRowClick={(params) => navigate(`/clientes/${params.row.cliente}`)}
							autoHeight
							hideFooter
							sx={{ cursor: 'pointer' }}
						/>
					)}
				</div>
			}
		/>
	);
}

export default AlertasListView;
