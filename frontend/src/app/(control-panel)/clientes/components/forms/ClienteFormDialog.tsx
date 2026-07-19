import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { useCreateCliente, useUpdateCliente } from '../../api/hooks/useClientes';
import type { Cliente } from '../../api/types';
import { extractErrorMessage } from '@/utils/apiError';

const schema = z.object({
	nom: z.string().min(1, 'El nombre es obligatorio'),
	prenom: z.string().min(1, 'El apellido es obligatorio'),
	email: z.string().email('Email no válido').optional().or(z.literal('')),
	telephone: z.string().optional(),
	adresse: z.string().optional(),
	date_naissance: z.string().optional(),
	nationalite: z.string().optional(),
	numero_nie: z.string().optional(),
	numero_passeport: z.string().optional(),
	numero_dni: z.string().optional(),
	notes: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

const emptyValues: FormValues = {
	nom: '',
	prenom: '',
	email: '',
	telephone: '',
	adresse: '',
	date_naissance: '',
	nationalite: '',
	numero_nie: '',
	numero_passeport: '',
	numero_dni: '',
	notes: ''
};

type ClienteFormDialogProps = {
	open: boolean;
	cliente?: Cliente | null;
	onClose: () => void;
	onCreated?: (cliente: Cliente) => void;
};

function ClienteFormDialog(props: ClienteFormDialogProps) {
	const { open, cliente, onClose, onCreated } = props;
	const { enqueueSnackbar } = useSnackbar();
	const isEdition = !!cliente;

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting }
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: emptyValues
	});

	useEffect(() => {
		if (open) {
			reset(
				cliente
					? {
							nom: cliente.nom,
							prenom: cliente.prenom,
							email: cliente.email,
							telephone: cliente.telephone,
							adresse: cliente.adresse,
							date_naissance: cliente.date_naissance ?? '',
							nationalite: cliente.nationalite,
							numero_nie: cliente.numero_nie,
							numero_passeport: cliente.numero_passeport,
							numero_dni: cliente.numero_dni,
							notes: cliente.notes
						}
					: emptyValues
			);
		}
	}, [open, cliente, reset]);

	const createMutation = useCreateCliente();
	const updateMutation = useUpdateCliente();
	const isPending = createMutation.isPending || updateMutation.isPending;

	async function onSubmit(values: FormValues) {
		const payload = {
			...values,
			date_naissance: values.date_naissance || null
		};

		try {
			if (isEdition) {
				await updateMutation.mutateAsync({ id: cliente!.id, payload });
				enqueueSnackbar('Cliente modificado', { variant: 'success' });
			} else {
				const creado = await createMutation.mutateAsync(payload);
				enqueueSnackbar('Cliente creado', { variant: 'success' });
				onCreated?.(creado);
			}

			onClose();
		} catch (error) {
			enqueueSnackbar(await extractErrorMessage(error), { variant: 'error' });
		}
	}

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullWidth
			maxWidth="sm"
		>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex min-h-0 flex-col"
			>
				<DialogTitle>{isEdition ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
				<DialogContent className="flex min-h-0 flex-col gap-4 pt-2">
					<Typography
						variant="caption"
						className="text-text-secondary font-semibold tracking-wide uppercase"
					>
						Identidad
					</Typography>
					<div className="grid grid-cols-2 gap-4">
						<TextField
							autoFocus
							label="Nombre"
							fullWidth
							{...register('nom')}
							error={!!errors.nom}
							helperText={errors.nom?.message}
						/>
						<TextField
							label="Apellido"
							fullWidth
							{...register('prenom')}
							error={!!errors.prenom}
							helperText={errors.prenom?.message}
						/>
						<TextField
							label="Fecha de nacimiento"
							type="date"
							fullWidth
							slotProps={{ inputLabel: { shrink: true } }}
							{...register('date_naissance')}
						/>
						<TextField
							label="Nacionalidad"
							fullWidth
							{...register('nationalite')}
						/>
					</div>

					<Typography
						variant="caption"
						className="text-text-secondary mt-1 font-semibold tracking-wide uppercase"
					>
						Documentos
					</Typography>
					<div className="grid grid-cols-3 gap-4">
						<TextField
							label="NIE"
							fullWidth
							{...register('numero_nie')}
						/>
						<TextField
							label="Pasaporte"
							fullWidth
							{...register('numero_passeport')}
						/>
						<TextField
							label="DNI"
							fullWidth
							{...register('numero_dni')}
						/>
					</div>

					<Typography
						variant="caption"
						className="text-text-secondary mt-1 font-semibold tracking-wide uppercase"
					>
						Contacto
					</Typography>
					<div className="grid grid-cols-2 gap-4">
						<TextField
							label="Teléfono"
							fullWidth
							{...register('telephone')}
						/>
						<TextField
							label="Email"
							fullWidth
							{...register('email')}
							error={!!errors.email}
							helperText={errors.email?.message}
						/>
						<TextField
							label="Dirección"
							fullWidth
							className="col-span-2"
							{...register('adresse')}
						/>
						<TextField
							label="Notas"
							fullWidth
							multiline
							minRows={2}
							className="col-span-2"
							{...register('notes')}
						/>
					</div>
				</DialogContent>
				<DialogActions className="p-4">
					<Button onClick={onClose}>Cancelar</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={isSubmitting || isPending}
					>
						{isEdition ? 'Guardar' : 'Crear'}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}

export default ClienteFormDialog;
