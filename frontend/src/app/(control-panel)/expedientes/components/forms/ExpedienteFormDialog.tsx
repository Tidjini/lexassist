import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useClientes } from '../../../clientes/api/hooks/useClientes';
import type { Cliente } from '../../../clientes/api/types';
import { useCreateExpediente, useUpdateExpediente } from '../../api/hooks/useExpedientes';
import type { Expediente } from '../../api/types';
import { extractErrorMessage } from '@/utils/apiError';

function buildSchema(t: (key: string) => string) {
	return z.object({
		cliente: z
			.number()
			.nullable()
			.refine((v) => v !== null, { message: t('expedientes.errorClienteObligatorio') }),
		titre: z.string().min(1, t('expedientes.errorTituloObligatorio')),
		type_procedure: z.string().optional(),
		notes: z.string().optional()
	});
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

type ExpedienteFormDialogProps = {
	open: boolean;
	expediente?: Expediente | null;
	clienteFijo?: { id: number; label: string } | null;
	onClose: () => void;
	onCreated?: (expediente: Expediente) => void;
};

function ExpedienteFormDialog(props: ExpedienteFormDialogProps) {
	const { open, expediente, clienteFijo, onClose, onCreated } = props;
	const { t } = useTranslation();
	const { enqueueSnackbar } = useSnackbar();
	const isEdition = !!expediente;
	const [busquedaCliente, setBusquedaCliente] = useState('');

	const { data: clientesData } = useClientes(
		{ search: busquedaCliente || undefined, page: 1 },
		{ enabled: open && !clienteFijo }
	);

	const schema = useMemo(() => buildSchema(t), [t]);

	const {
		register,
		control,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting }
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { cliente: clienteFijo?.id ?? null, titre: '', type_procedure: '', notes: '' }
	});

	useEffect(() => {
		if (open) {
			reset(
				expediente
					? {
							cliente: expediente.cliente,
							titre: expediente.titre,
							type_procedure: expediente.type_procedure,
							notes: expediente.notes
						}
					: { cliente: clienteFijo?.id ?? null, titre: '', type_procedure: '', notes: '' }
			);
		}
	}, [open, expediente, clienteFijo, reset]);

	const createMutation = useCreateExpediente();
	const updateMutation = useUpdateExpediente();
	const isPending = createMutation.isPending || updateMutation.isPending;

	async function onSubmit(values: FormValues) {
		try {
			if (isEdition) {
				const actualizado = await updateMutation.mutateAsync({
					id: expediente!.id,
					payload: { titre: values.titre, type_procedure: values.type_procedure, notes: values.notes }
				});
				enqueueSnackbar(t('expedientes.modificado'), { variant: 'success' });
				onCreated?.(actualizado);
			} else {
				const creado = await createMutation.mutateAsync({
					cliente: values.cliente!,
					titre: values.titre,
					type_procedure: values.type_procedure,
					notes: values.notes
				});
				enqueueSnackbar(t('expedientes.creado'), { variant: 'success' });
				onCreated?.(creado);
			}

			onClose();
		} catch (error) {
			enqueueSnackbar(await extractErrorMessage(error), { variant: 'error' });
		}
	}

	const opcionesCliente: Cliente[] = clientesData?.results ?? [];

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
				<DialogTitle>
					{isEdition ? t('expedientes.formTituloEditar') : t('expedientes.formTituloNuevo')}
				</DialogTitle>
				<DialogContent className="flex min-h-0 flex-col gap-4 pt-2">
					{clienteFijo ? (
						<TextField
							label={t('expedientes.campoCliente')}
							value={clienteFijo.label}
							disabled
							fullWidth
						/>
					) : (
						<Controller
							name="cliente"
							control={control}
							render={({ field }) => (
								<Autocomplete
									disabled={isEdition}
									options={opcionesCliente}
									getOptionLabel={(c) => `${c.prenom} ${c.nom}`}
									getOptionKey={(c) => c.id}
									value={opcionesCliente.find((c) => c.id === field.value) ?? null}
									onInputChange={(_e, valeur) => setBusquedaCliente(valeur)}
									onChange={(_e, cliente) => field.onChange(cliente ? cliente.id : null)}
									slotProps={{ popper: { style: { zIndex: 10000 } } }}
									renderInput={(params) => (
										<TextField
											{...params}
											label={t('expedientes.campoCliente')}
											error={!!errors.cliente}
											helperText={errors.cliente?.message}
										/>
									)}
								/>
							)}
						/>
					)}

					<TextField
						autoFocus
						label={t('expedientes.campoTitulo')}
						fullWidth
						{...register('titre')}
						error={!!errors.titre}
						helperText={errors.titre?.message}
					/>
					<TextField
						label={t('expedientes.campoTramite')}
						fullWidth
						placeholder={t('expedientes.campoTramitePlaceholder')}
						{...register('type_procedure')}
					/>
					<TextField
						label={t('expedientes.campoNotas')}
						fullWidth
						multiline
						minRows={3}
						{...register('notes')}
					/>
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

export default ExpedienteFormDialog;
