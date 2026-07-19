import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useClientes } from '../../../clientes/api/hooks/useClientes';
import type { Cliente } from '../../../clientes/api/types';
import { useSubirDocumento } from '../../api/hooks/useDocumentos';
import { CATEGORIAS, type CategoriaDocumento } from '../../api/types';
import { extractErrorMessage } from '@/utils/apiError';

type DocumentoUploadDialogProps = {
	open: boolean;
	clienteFijo?: { id: number; label: string } | null;
	onClose: () => void;
};

function DocumentoUploadDialog(props: DocumentoUploadDialogProps) {
	const { open, clienteFijo, onClose } = props;
	const { t } = useTranslation();
	const { enqueueSnackbar } = useSnackbar();
	const [busquedaCliente, setBusquedaCliente] = useState('');
	const [cliente, setCliente] = useState<Cliente | null>(null);
	const [categoria, setCategoria] = useState<CategoriaDocumento>('AUTRE');
	const [fichier, setFichier] = useState<File | null>(null);

	const { data: clientesData } = useClientes(
		{ search: busquedaCliente || undefined, page: 1 },
		{ enabled: open && !clienteFijo }
	);

	const subirMutation = useSubirDocumento();

	function reset() {
		setCliente(null);
		setCategoria('AUTRE');
		setFichier(null);
		setBusquedaCliente('');
	}

	async function onSubmit() {
		const clienteId = clienteFijo?.id ?? cliente?.id;

		if (!clienteId || !fichier) {
			enqueueSnackbar(t('documentos.upload.errorFaltan'), { variant: 'error' });
			return;
		}

		try {
			await subirMutation.mutateAsync({ cliente: clienteId, categorie: categoria, fichier });
			enqueueSnackbar(t('documentos.upload.subido'), { variant: 'success' });
			reset();
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
			<DialogTitle>{t('documentos.upload.titulo')}</DialogTitle>
			<DialogContent className="flex flex-col gap-4 pt-2">
				{clienteFijo ? (
					<TextField
						label={t('documentos.upload.campoCliente')}
						value={clienteFijo.label}
						disabled
						fullWidth
					/>
				) : (
					<Autocomplete
						options={clientesData?.results ?? []}
						getOptionLabel={(c) => `${c.prenom} ${c.nom}`}
						getOptionKey={(c) => c.id}
						value={cliente}
						onInputChange={(_e, valeur) => setBusquedaCliente(valeur)}
						onChange={(_e, valeur) => setCliente(valeur)}
						slotProps={{ popper: { style: { zIndex: 10000 } } }}
						renderInput={(params) => (
							<TextField
								{...params}
								label={t('documentos.upload.campoCliente')}
							/>
						)}
					/>
				)}

				<TextField
					select
					label={t('documentos.upload.campoCategoria')}
					value={categoria}
					onChange={(e) => setCategoria(e.target.value as CategoriaDocumento)}
					fullWidth
				>
					{CATEGORIAS.map((c) => (
						<MenuItem
							key={c.value}
							value={c.value}
						>
							{t(c.labelKey)}
						</MenuItem>
					))}
				</TextField>

				<Button
					component="label"
					variant="outlined"
					startIcon={<FuseSvgIcon size={18}>lucide:upload</FuseSvgIcon>}
				>
					{fichier ? fichier.name : t('documentos.upload.seleccionarArchivo')}
					<input
						type="file"
						hidden
						accept="image/jpeg,image/png,image/webp,application/pdf"
						onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
					/>
				</Button>
				<Typography
					variant="caption"
					color="text.secondary"
				>
					{t('documentos.upload.formatosAceptados')}
				</Typography>
			</DialogContent>
			<DialogActions className="p-4">
				<Button onClick={onClose}>{t('comun.cancelar')}</Button>
				<Button
					variant="contained"
					disabled={subirMutation.isPending}
					onClick={onSubmit}
				>
					{t('documentos.upload.botonSubir')}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default DocumentoUploadDialog;
