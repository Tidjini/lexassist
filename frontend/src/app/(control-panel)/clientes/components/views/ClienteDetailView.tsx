import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ListSkeleton from '@/components/ListSkeleton';
import InitialsAvatar from '@/components/InitialsAvatar';
import { ACCENTS } from '@/configs/designTokens';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useCliente, useDeleteCliente } from '../../api/hooks/useClientes';
import ClienteFormDialog from '../forms/ClienteFormDialog';
import ClienteExpedientesTab from './ClienteExpedientesTab';
import ClienteDocumentosTab from './ClienteDocumentosTab';

function Champ({ label, valeur }: { label: string; valeur?: string | null }) {
	if (!valeur) return null;

	return (
		<div>
			<Typography
				variant="caption"
				color="text.secondary"
			>
				{label}
			</Typography>
			<Typography variant="body1">{valeur}</Typography>
		</div>
	);
}

function TituloSeccion({ icono, texto }: { icono: string; texto: string }) {
	return (
		<div className="mb-3 flex items-center gap-2">
			<FuseSvgIcon
				size={18}
				style={{ color: ACCENTS.clientes }}
			>
				{icono}
			</FuseSvgIcon>
			<Typography className="font-semibold">{texto}</Typography>
		</div>
	);
}

function ClienteDetailView() {
	const { clienteId } = useParams<{ clienteId: string }>();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { enqueueSnackbar } = useSnackbar();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [tab, setTab] = useState<'datos' | 'expedientes' | 'documentos'>('datos');
	const { data: cliente, isLoading } = useCliente(clienteId);
	const deleteMutation = useDeleteCliente();

	async function eliminar() {
		if (!cliente) return;

		if (!window.confirm(t('clientes.confirmarEliminar', { nombre: `${cliente.prenom} ${cliente.nom}` }))) return;

		try {
			await deleteMutation.mutateAsync(cliente.id);
			enqueueSnackbar(t('clientes.eliminado'), { variant: 'success' });
			navigate('/clientes');
		} catch {
			enqueueSnackbar(t('clientes.errorEliminar'), { variant: 'error' });
		}
	}

	return (
		<>
			<FusePageSimple
				header={
					<div className="flex flex-wrap items-center gap-3 p-6">
						<IconButton onClick={() => navigate('/clientes')}>
							<FuseSvgIcon>lucide:arrow-left</FuseSvgIcon>
						</IconButton>
						{cliente && (
							<InitialsAvatar
								nombre={`${cliente.prenom} ${cliente.nom}`}
								accent={ACCENTS.clientes}
								size={48}
							/>
						)}
						<div className="flex-1">
							<Typography
								variant="h4"
								className="font-bold"
							>
								{cliente ? `${cliente.prenom} ${cliente.nom}` : t('clientes.columnaCliente')}
							</Typography>
							{cliente && (
								<Chip
									size="small"
									label={cliente.actif ? t('clientes.estadoActivo') : t('clientes.estadoInactivo')}
									color={cliente.actif ? 'success' : 'default'}
								/>
							)}
						</div>
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

						{cliente && (
							<div className="flex flex-col gap-4">
								<Tabs
									value={tab}
									onChange={(_e, valeur) => setTab(valeur)}
									className="mb-2"
								>
									<Tab
										value="datos"
										label={t('clientes.detalle.tabDatos')}
									/>
									<Tab
										value="expedientes"
										label={t('clientes.detalle.expedientes', { count: cliente.nb_dossiers })}
									/>
									<Tab
										value="documentos"
										label={t('clientes.detalle.documentos')}
									/>
								</Tabs>

								{tab === 'datos' && (
									<div className="flex flex-col gap-4">
										<Paper className="rounded-xl p-6">
											<TituloSeccion
												icono="lucide:id-card"
												texto={t('clientes.seccionIdentidad')}
											/>
											<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
												<Champ
													label={t('clientes.campoFechaNacimiento')}
													valeur={cliente.date_naissance}
												/>
												<Champ
													label={t('clientes.campoNacionalidad')}
													valeur={cliente.nationalite}
												/>
												<Champ
													label={t('clientes.campoNie')}
													valeur={cliente.numero_nie}
												/>
												<Champ
													label={t('clientes.campoPasaporte')}
													valeur={cliente.numero_passeport}
												/>
												<Champ
													label={t('clientes.campoDni')}
													valeur={cliente.numero_dni}
												/>
											</div>
										</Paper>

										{(cliente.telephone || cliente.email || cliente.adresse) && (
											<Paper className="rounded-xl p-6">
												<TituloSeccion
													icono="lucide:contact"
													texto={t('clientes.seccionContacto')}
												/>
												<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
													<Champ
														label={t('clientes.campoTelefono')}
														valeur={cliente.telephone}
													/>
													<Champ
														label={t('clientes.campoEmail')}
														valeur={cliente.email}
													/>
													<Champ
														label={t('clientes.campoDireccion')}
														valeur={cliente.adresse}
													/>
												</div>
											</Paper>
										)}

										{cliente.notes && (
											<Paper className="rounded-xl p-6">
												<TituloSeccion
													icono="lucide:sticky-note"
													texto={t('clientes.detalle.notas')}
												/>
												<Typography
													variant="body2"
													className="whitespace-pre-wrap"
												>
													{cliente.notes}
												</Typography>
											</Paper>
										)}

										{cliente.cree_par && (
											<Typography
												variant="caption"
												color="text.secondary"
											>
												{t('clientes.detalle.creadoPor', {
													nombre: cliente.cree_par.displayName
												})}
											</Typography>
										)}
									</div>
								)}

								{tab === 'expedientes' && (
									<ClienteExpedientesTab
										clienteId={cliente.id}
										clienteLabel={`${cliente.prenom} ${cliente.nom}`}
									/>
								)}

								{tab === 'documentos' && (
									<ClienteDocumentosTab
										clienteId={cliente.id}
										clienteLabel={`${cliente.prenom} ${cliente.nom}`}
									/>
								)}
							</div>
						)}
					</div>
				}
			/>

			<ClienteFormDialog
				open={dialogOpen}
				cliente={cliente}
				onClose={() => setDialogOpen(false)}
			/>
		</>
	);
}

export default ClienteDetailView;
