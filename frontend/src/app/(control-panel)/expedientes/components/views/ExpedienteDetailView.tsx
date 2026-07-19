import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import ListSkeleton from '@/components/ListSkeleton';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useCambiarEstado, useDeleteExpediente, useExpediente } from '../../api/hooks/useExpedientes';
import { ESTADOS, estadoInfo, type EstadoExpediente } from '../../api/types';
import { extractErrorMessage } from '@/utils/apiError';
import ExpedienteFormDialog from '../forms/ExpedienteFormDialog';

function ExpedienteDetailView() {
	const { expedienteId } = useParams<{ expedienteId: string }>();
	const navigate = useNavigate();
	const { t, i18n } = useTranslation();
	const { enqueueSnackbar } = useSnackbar();
	const [dialogOpen, setDialogOpen] = useState(false);
	const { data: expediente, isLoading } = useExpediente(expedienteId);
	const cambiarEstadoMutation = useCambiarEstado();
	const deleteMutation = useDeleteExpediente();

	async function onCambiarEstado(nuevoEstado: EstadoExpediente) {
		if (!expediente || nuevoEstado === expediente.statut) return;

		try {
			await cambiarEstadoMutation.mutateAsync({ id: expediente.id, statut: nuevoEstado });
			enqueueSnackbar(t('expedientes.detalle.estadoActualizado'), { variant: 'success' });
		} catch (error) {
			enqueueSnackbar(await extractErrorMessage(error), { variant: 'error' });
		}
	}

	async function eliminar() {
		if (!expediente) return;

		if (!window.confirm(t('expedientes.detalle.confirmarEliminar', { titulo: expediente.titre }))) return;

		try {
			await deleteMutation.mutateAsync(expediente.id);
			enqueueSnackbar(t('expedientes.detalle.eliminado'), { variant: 'success' });
			navigate('/expedientes');
		} catch {
			enqueueSnackbar(t('expedientes.detalle.errorEliminar'), { variant: 'error' });
		}
	}

	return (
		<>
			<FusePageSimple
				header={
					<div className="flex items-center gap-3 p-6">
						<IconButton onClick={() => navigate('/expedientes')}>
							<FuseSvgIcon>lucide:arrow-left</FuseSvgIcon>
						</IconButton>
						<div className="flex-1">
							<Typography
								variant="h4"
								className="font-bold"
							>
								{expediente?.titre ?? t('expedientes.columnaExpediente')}
							</Typography>
							{expediente && (
								<Typography color="text.secondary">{expediente.cliente_nom_complet}</Typography>
							)}
						</div>
						{expediente && (
							<Select
								size="small"
								value={expediente.statut}
								onChange={(e) => onCambiarEstado(e.target.value as EstadoExpediente)}
							>
								{ESTADOS.map((e) => (
									<MenuItem
										key={e.value}
										value={e.value}
									>
										{t(e.labelKey)}
									</MenuItem>
								))}
							</Select>
						)}
						<Button
							variant="outlined"
							startIcon={<FuseSvgIcon size={18}>lucide:file-text</FuseSvgIcon>}
							onClick={() => navigate(`/documentos?dossier=${expedienteId}`)}
						>
							{t('expedientes.detalle.documentos')}
						</Button>
						<Button
							variant="outlined"
							startIcon={<FuseSvgIcon size={18}>lucide:pencil</FuseSvgIcon>}
							onClick={() => setDialogOpen(true)}
						>
							{t('comun.editar')}
						</Button>
						<Button
							variant="outlined"
							color="error"
							startIcon={<FuseSvgIcon size={18}>lucide:trash-2</FuseSvgIcon>}
							onClick={eliminar}
						>
							{t('comun.eliminar')}
						</Button>
					</div>
				}
				content={
					<div className="p-6">
						{isLoading && <ListSkeleton />}

						{expediente && (
							<div className="flex flex-col gap-4">
								<Paper className="rounded-xl p-6">
									<Typography className="mb-3 font-semibold">
										{t('expedientes.detalle.detalles')}
									</Typography>
									<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
										<div>
											<Typography
												variant="caption"
												color="text.secondary"
											>
												{t('expedientes.detalle.tipoTramite')}
											</Typography>
											<Typography variant="body1">{expediente.type_procedure || '—'}</Typography>
										</div>
										<div>
											<Typography
												variant="caption"
												color="text.secondary"
											>
												{t('expedientes.detalle.fechaApertura')}
											</Typography>
											<Typography variant="body1">{expediente.date_ouverture}</Typography>
										</div>
										{expediente.date_cloture && (
											<div>
												<Typography
													variant="caption"
													color="text.secondary"
												>
													{t('expedientes.detalle.fechaCierre')}
												</Typography>
												<Typography variant="body1">{expediente.date_cloture}</Typography>
											</div>
										)}
									</div>
									{expediente.notes && (
										<Typography
											variant="body2"
											className="mt-4 whitespace-pre-wrap"
										>
											{expediente.notes}
										</Typography>
									)}
								</Paper>

								<Paper className="rounded-xl p-6">
									<Typography className="mb-3 font-semibold">
										{t('expedientes.detalle.historial')}
									</Typography>
									{!expediente.evenements || expediente.evenements.length === 0 ? (
										<Typography
											variant="body2"
											color="text.disabled"
										>
											{t('expedientes.detalle.sinHistorial')}
										</Typography>
									) : (
										<div className="flex flex-col gap-3">
											{expediente.evenements.map((evento) => {
												const info = estadoInfo(evento.nouveau_statut);
												return (
													<div
														key={evento.id}
														className="flex items-center gap-3 border-b pb-3 last:border-b-0 last:pb-0"
														style={{ borderColor: 'var(--mui-palette-divider)' }}
													>
														<Chip
															size="small"
															label={info && t(info.labelKey)}
															color={info?.color}
														/>
														<div className="flex-1">
															<Typography variant="body2">
																{evento.auteur?.displayName ??
																	t('expedientes.detalle.sistema')}
																{evento.commentaire ? ` — ${evento.commentaire}` : ''}
															</Typography>
															<Typography
																variant="caption"
																color="text.secondary"
															>
																{new Date(evento.created_at).toLocaleString(
																	i18n.language === 'fr' ? 'fr-FR' : 'es-ES'
																)}
															</Typography>
														</div>
													</div>
												);
											})}
										</div>
									)}
								</Paper>
							</div>
						)}
					</div>
				}
			/>

			<ExpedienteFormDialog
				open={dialogOpen}
				expediente={expediente}
				onClose={() => setDialogOpen(false)}
			/>
		</>
	);
}

export default ExpedienteDetailView;
