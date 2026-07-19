import { useEffect, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useCreateCliente, useUpdateCliente } from '../../api/hooks/useClientes';
import type { Cliente } from '../../api/types';
import { extractErrorMessage } from '@/utils/apiError';

// prenom = prénom/nombre (affiché en premier dans un formulaire hispanophone),
// nom = apellidos — messages d'erreur alignés sur les libellés affichés, pas sur
// les noms de champs (hérités du modèle Django, en français).
function buildSchema(t: (key: string) => string) {
	return z.object({
		nom: z.string().min(1, t('clientes.errorApellidoObligatorio')),
		prenom: z.string().min(1, t('clientes.errorNombreObligatorio')),
		email: z.string().email(t('clientes.errorEmailInvalido')).optional().or(z.literal('')),
		telephone: z.string().optional(),
		adresse: z.string().optional(),
		date_naissance: z.string().optional(),
		nationalite: z.string().optional(),
		numero_nie: z.string().optional(),
		numero_passeport: z.string().optional(),
		numero_dni: z.string().optional(),
		notes: z.string().optional()
	});
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

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
	const { t } = useTranslation();
	const { enqueueSnackbar } = useSnackbar();
	const isEdition = !!cliente;

	const schema = useMemo(() => buildSchema(t), [t]);

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
				enqueueSnackbar(t('clientes.modificado'), { variant: 'success' });
			} else {
				const creado = await createMutation.mutateAsync(payload);
				enqueueSnackbar(t('clientes.creado'), { variant: 'success' });
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
				<DialogTitle>{isEdition ? t('clientes.formTituloEditar') : t('clientes.formTituloNuevo')}</DialogTitle>
				<DialogContent className="flex min-h-0 flex-col gap-4 pt-2">
					<Typography
						variant="caption"
						className="text-text-secondary font-semibold tracking-wide uppercase"
					>
						{t('clientes.seccionIdentidad')}
					</Typography>
					<div className="grid grid-cols-2 gap-4">
						<TextField
							autoFocus
							label={t('clientes.campoNombre')}
							fullWidth
							{...register('prenom')}
							error={!!errors.prenom}
							helperText={errors.prenom?.message}
						/>
						<TextField
							label={t('clientes.campoApellidos')}
							fullWidth
							{...register('nom')}
							error={!!errors.nom}
							helperText={errors.nom?.message}
						/>
						<TextField
							label={t('clientes.campoFechaNacimiento')}
							type="date"
							fullWidth
							slotProps={{ inputLabel: { shrink: true } }}
							{...register('date_naissance')}
						/>
						<TextField
							label={t('clientes.campoNacionalidad')}
							fullWidth
							{...register('nationalite')}
						/>
					</div>

					<Typography
						variant="caption"
						className="text-text-secondary mt-1 font-semibold tracking-wide uppercase"
					>
						{t('clientes.seccionDocumentos')}
					</Typography>
					<div className="grid grid-cols-3 gap-4">
						<TextField
							label={t('clientes.campoNie')}
							fullWidth
							{...register('numero_nie')}
						/>
						<TextField
							label={t('clientes.campoPasaporte')}
							fullWidth
							{...register('numero_passeport')}
						/>
						<TextField
							label={t('clientes.campoDni')}
							fullWidth
							{...register('numero_dni')}
						/>
					</div>

					<Typography
						variant="caption"
						className="text-text-secondary mt-1 font-semibold tracking-wide uppercase"
					>
						{t('clientes.seccionContacto')}
					</Typography>
					<div className="grid grid-cols-2 gap-4">
						<TextField
							label={t('clientes.campoTelefono')}
							fullWidth
							{...register('telephone')}
						/>
						<TextField
							label={t('clientes.campoEmail')}
							fullWidth
							{...register('email')}
							error={!!errors.email}
							helperText={errors.email?.message}
						/>
						<TextField
							label={t('clientes.campoDireccion')}
							fullWidth
							className="col-span-2"
							{...register('adresse')}
						/>
						<TextField
							label={t('clientes.campoNotas')}
							fullWidth
							multiline
							minRows={2}
							className="col-span-2"
							{...register('notes')}
						/>
					</div>
				</DialogContent>
				<DialogActions className="p-4">
					<Button onClick={onClose}>{t('comun.cancelar')}</Button>
					<Button
						type="submit"
						variant="contained"
						disabled={isSubmitting || isPending}
					>
						{isEdition ? t('comun.guardar') : t('comun.crear')}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}

export default ClienteFormDialog;
