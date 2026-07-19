import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import FusePageSimple from '@fuse/core/FusePageSimple';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ListSkeleton from '@/components/ListSkeleton';
import { useSnackbar } from 'notistack';
import { useCliente, useDeleteCliente } from '../../api/hooks/useClientes';
import ClienteFormDialog from '../forms/ClienteFormDialog';

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

function ClienteDetailView() {
	const { clienteId } = useParams<{ clienteId: string }>();
	const navigate = useNavigate();
	const { enqueueSnackbar } = useSnackbar();
	const [dialogOpen, setDialogOpen] = useState(false);
	const { data: cliente, isLoading } = useCliente(clienteId);
	const deleteMutation = useDeleteCliente();

	async function eliminar() {
		if (!cliente) return;

		if (!window.confirm(`¿Eliminar a ${cliente.prenom} ${cliente.nom}?`)) return;

		try {
			await deleteMutation.mutateAsync(cliente.id);
			enqueueSnackbar('Cliente eliminado', { variant: 'success' });
			navigate('/clientes');
		} catch {
			enqueueSnackbar('No se pudo eliminar el cliente', { variant: 'error' });
		}
	}

	return (
		<>
			<FusePageSimple
				header={
					<div className="flex items-center gap-3 p-6">
						<IconButton onClick={() => navigate('/clientes')}>
							<FuseSvgIcon>lucide:arrow-left</FuseSvgIcon>
						</IconButton>
						<div className="flex-1">
							<Typography
								variant="h4"
								className="font-bold"
							>
								{cliente ? `${cliente.prenom} ${cliente.nom}` : 'Cliente'}
							</Typography>
							{cliente && (
								<Chip
									size="small"
									label={cliente.actif ? 'Activo' : 'Inactivo'}
									color={cliente.actif ? 'success' : 'default'}
								/>
							)}
						</div>
						<Button
							variant="outlined"
							startIcon={<FuseSvgIcon size={18}>lucide:folder-open</FuseSvgIcon>}
							onClick={() => navigate(`/expedientes?cliente=${clienteId}`)}
						>
							Expedientes ({cliente?.nb_dossiers ?? 0})
						</Button>
						<Button
							variant="outlined"
							startIcon={<FuseSvgIcon size={18}>lucide:file-text</FuseSvgIcon>}
							onClick={() => navigate(`/documentos?cliente=${clienteId}`)}
						>
							Documentos
						</Button>
						<Button
							variant="outlined"
							startIcon={<FuseSvgIcon size={18}>lucide:pencil</FuseSvgIcon>}
							onClick={() => setDialogOpen(true)}
						>
							Editar
						</Button>
						<Button
							variant="outlined"
							color="error"
							startIcon={<FuseSvgIcon size={18}>lucide:trash-2</FuseSvgIcon>}
							onClick={eliminar}
						>
							Eliminar
						</Button>
					</div>
				}
				content={
					<div className="p-6">
						{isLoading && <ListSkeleton />}

						{cliente && (
							<div className="flex flex-col gap-4">
								<Paper className="rounded-xl p-6">
									<Typography className="mb-3 font-semibold">Identidad</Typography>
									<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
										<Champ
											label="Fecha de nacimiento"
											valeur={cliente.date_naissance}
										/>
										<Champ
											label="Nacionalidad"
											valeur={cliente.nationalite}
										/>
										<Champ
											label="NIE"
											valeur={cliente.numero_nie}
										/>
										<Champ
											label="Pasaporte"
											valeur={cliente.numero_passeport}
										/>
										<Champ
											label="DNI"
											valeur={cliente.numero_dni}
										/>
									</div>
								</Paper>

								<Paper className="rounded-xl p-6">
									<Typography className="mb-3 font-semibold">Contacto</Typography>
									<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
										<Champ
											label="Teléfono"
											valeur={cliente.telephone}
										/>
										<Champ
											label="Email"
											valeur={cliente.email}
										/>
										<Champ
											label="Dirección"
											valeur={cliente.adresse}
										/>
									</div>
								</Paper>

								{cliente.notes && (
									<Paper className="rounded-xl p-6">
										<Typography className="mb-3 font-semibold">Notas</Typography>
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
										Creado por {cliente.cree_par.displayName}
									</Typography>
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
