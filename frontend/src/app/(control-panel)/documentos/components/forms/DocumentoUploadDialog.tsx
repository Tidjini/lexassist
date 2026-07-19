import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useClientes } from '../../../clientes/api/hooks/useClientes';
import type { Cliente } from '../../../clientes/api/types';
import { useSubirDocumento } from '../../api/hooks/useDocumentos';
import { CATEGORIAS, type CategoriaDocumento } from '../../api/types';
import { ejecutarConConcurrencia } from '@/utils/concurrencia';

const CONCURRENCIA = 3;

type DocumentoUploadDialogProps = {
	open: boolean;
	clienteFijo?: { id: number; label: string } | null;
	dossierFijo?: number | null;
	onClose: () => void;
};

function DocumentoUploadDialog(props: DocumentoUploadDialogProps) {
	const { open, clienteFijo, dossierFijo, onClose } = props;
	const { t } = useTranslation();
	const { enqueueSnackbar } = useSnackbar();
	const [busquedaCliente, setBusquedaCliente] = useState('');
	const [cliente, setCliente] = useState<Cliente | null>(null);
	const [categoria, setCategoria] = useState<CategoriaDocumento>('AUTRE');
	const [fichiers, setFichiers] = useState<File[]>([]);
	const [subiendo, setSubiendo] = useState(false);

	const { data: clientesData } = useClientes(
		{ search: busquedaCliente || undefined, page: 1 },
		{ enabled: open && !clienteFijo }
	);

	const subirMutation = useSubirDocumento();

	function reset() {
		setCliente(null);
		setCategoria('AUTRE');
		setFichiers([]);
		setBusquedaCliente('');
	}

	function agregarArchivos(lista: FileList | null) {
		if (!lista) return;

		setFichiers((prev) => [...prev, ...Array.from(lista)]);
	}

	function quitarArchivo(indice: number) {
		setFichiers((prev) => prev.filter((_f, i) => i !== indice));
	}

	async function onSubmit() {
		const clienteId = clienteFijo?.id ?? cliente?.id;

		if (fichiers.length === 0) {
			enqueueSnackbar(t('documentos.upload.errorFaltan'), { variant: 'error' });
			return;
		}

		setSubiendo(true);
		let exitos = 0;
		let errores = 0;

		await ejecutarConConcurrencia(fichiers, CONCURRENCIA, async (fichier) => {
			try {
				await subirMutation.mutateAsync({
					cliente: clienteId,
					dossier: dossierFijo ?? undefined,
					categorie: categoria,
					fichier
				});
				exitos += 1;
			} catch {
				errores += 1;
			}
		});

		setSubiendo(false);

		if (exitos > 0) {
			enqueueSnackbar(
				exitos === 1
					? t('documentos.upload.subido')
					: t('documentos.upload.subidoPlural', { cantidad: exitos }),
				{ variant: 'success' }
			);
		}

		if (errores > 0) {
			enqueueSnackbar(t('documentos.upload.erroresParciales', { cantidad: errores }), { variant: 'error' });
		}

		if (errores === 0) {
			reset();
			onClose();
		} else {
			// On garde le dialogue ouvert avec seulement les fichiers en échec, pour
			// permettre de réessayer sans tout re-sélectionner.
			setFichiers([]);
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
					<>
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
						<Typography
							variant="caption"
							color="text.secondary"
							className="-mt-2"
						>
							{t('documentos.upload.clienteOpcional')}
						</Typography>
					</>
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
					{t('documentos.upload.seleccionarArchivo')}
					<input
						type="file"
						hidden
						multiple
						accept="image/jpeg,image/png,image/webp,application/pdf"
						onChange={(e) => {
							agregarArchivos(e.target.files);
							e.target.value = '';
						}}
					/>
				</Button>

				{fichiers.length > 0 && (
					<Paper
						variant="outlined"
						className="flex flex-col divide-y rounded-xl"
					>
						{fichiers.map((fichier, indice) => (
							<div
								key={`${fichier.name}-${indice}`}
								className="flex items-center justify-between gap-2 px-3 py-1.5"
							>
								<Typography
									variant="body2"
									className="truncate"
								>
									{fichier.name}
								</Typography>
								<IconButton
									size="small"
									onClick={() => quitarArchivo(indice)}
								>
									<FuseSvgIcon size={16}>lucide:x</FuseSvgIcon>
								</IconButton>
							</div>
						))}
					</Paper>
				)}

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
					disabled={subiendo}
					onClick={onSubmit}
				>
					{fichiers.length > 1
						? t('documentos.upload.botonSubirVarios', { cantidad: fichiers.length })
						: t('documentos.upload.botonSubir')}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default DocumentoUploadDialog;
