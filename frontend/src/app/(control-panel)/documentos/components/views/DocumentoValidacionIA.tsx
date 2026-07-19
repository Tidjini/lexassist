import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import { useCliente, useClientes } from '../../../clientes/api/hooks/useClientes';
import type { Cliente } from '../../../clientes/api/types';
import { useAplicarACliente, useAsignarCliente, useConfirmarCliente } from '../../api/hooks/useDocumentos';
import { categoriaLabelKey, estadoIaInfo, type CamposExtraidos, type Documento } from '../../api/types';
import { extractErrorMessage } from '@/utils/apiError';

const ETIQUETAS_CAMPO: Record<keyof CamposExtraidos, string> = {
	nombre: 'documentos.ia.campoNombre',
	apellidos: 'documentos.ia.campoApellidos',
	numero_documento: 'documentos.ia.campoNumeroDocumento',
	fecha_nacimiento: 'documentos.ia.campoFechaNacimiento',
	nacionalidad: 'documentos.ia.campoNacionalidad'
};

function ClienteDelDocumento({
	documento,
	onActualizado
}: {
	documento: Documento;
	onActualizado: (documento: Documento) => void;
}) {
	const { t } = useTranslation();
	const { enqueueSnackbar } = useSnackbar();
	const [busqueda, setBusqueda] = useState('');
	const [seleccion, setSeleccion] = useState<Cliente | null>(null);
	const [cambiando, setCambiando] = useState(documento.cliente === null);

	const { data: clienteActual } = useCliente(documento.cliente ?? undefined);
	const { data: clientesData } = useClientes({ search: busqueda || undefined, page: 1 }, { enabled: cambiando });
	const asignarMutation = useAsignarCliente();
	const confirmarMutation = useConfirmarCliente();

	async function asignar() {
		if (!seleccion) return;

		try {
			const actualizado = await asignarMutation.mutateAsync({ id: documento.id, cliente: seleccion.id });
			onActualizado(actualizado);
			enqueueSnackbar(t('documentos.ia.clienteAsignado'), { variant: 'success' });
			setCambiando(false);
			setSeleccion(null);
		} catch (error) {
			enqueueSnackbar(await extractErrorMessage(error), { variant: 'error' });
		}
	}

	async function confirmar() {
		try {
			const actualizado = await confirmarMutation.mutateAsync(documento.id);
			onActualizado(actualizado);
			enqueueSnackbar(t('documentos.ia.clienteConfirmado'), { variant: 'success' });
		} catch (error) {
			enqueueSnackbar(await extractErrorMessage(error), { variant: 'error' });
		}
	}

	if (cambiando) {
		return (
			<div className="flex flex-col gap-2">
				<Typography
					variant="caption"
					className="text-text-secondary font-semibold tracking-wide uppercase"
				>
					{t('documentos.ia.clienteTitulo')}
				</Typography>
				<div className="flex items-center gap-2">
					<Autocomplete
						className="flex-1"
						size="small"
						options={clientesData?.results ?? []}
						getOptionLabel={(c) => `${c.prenom} ${c.nom}`}
						getOptionKey={(c) => c.id}
						value={seleccion}
						onInputChange={(_e, valeur) => setBusqueda(valeur)}
						onChange={(_e, valeur) => setSeleccion(valeur)}
						slotProps={{ popper: { style: { zIndex: 10000 } } }}
						renderInput={(params) => (
							<TextField
								{...params}
								label={t('documentos.ia.clienteBuscar')}
							/>
						)}
					/>
					<Button
						size="small"
						variant="contained"
						disabled={!seleccion || asignarMutation.isPending}
						onClick={asignar}
					>
						{t('documentos.ia.clienteAsignarBoton')}
					</Button>
					{documento.cliente !== null && (
						<Button
							size="small"
							onClick={() => setCambiando(false)}
						>
							{t('comun.cancelar')}
						</Button>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<Typography variant="body2">
				{t('documentos.ia.clienteAsociado', {
					nombre: clienteActual ? `${clienteActual.prenom} ${clienteActual.nom}` : '…'
				})}
			</Typography>
			{!documento.cliente_confirmado && (
				<>
					<Button
						size="small"
						variant="contained"
						disabled={confirmarMutation.isPending}
						onClick={confirmar}
					>
						{t('documentos.ia.clienteConfirmarBoton')}
					</Button>
					<Button
						size="small"
						onClick={() => setCambiando(true)}
					>
						{t('documentos.ia.clienteCambiarBoton')}
					</Button>
				</>
			)}
		</div>
	);
}

function DocumentoValidacionIA({ documento: documentoProp }: { documento: Documento }) {
	const { t } = useTranslation();
	const { enqueueSnackbar } = useSnackbar();
	const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
	const aplicarMutation = useAplicarACliente();

	// Le document reçu en prop est un instantané figé au moment où le dialogue de
	// prévisualisation s'est ouvert (voir DocumentosListView) : il ne se met pas à jour
	// tout seul quand une mutation (assignation/confirmation de client) réussit. On garde
	// donc une copie locale, rafraîchie avec la réponse de la mutation.
	const [documento, setDocumento] = useState(documentoProp);

	useEffect(() => {
		setDocumento(documentoProp);
	}, [documentoProp]);

	const info = estadoIaInfo(documento.estado_ia);
	const campos = Object.entries(documento.datos_extraidos || {}).filter(([, valeur]) => !!valeur) as [
		keyof CamposExtraidos,
		string
	][];

	function toggle(campo: string) {
		setSeleccionados((prev) => {
			const siguiente = new Set(prev);

			if (siguiente.has(campo)) siguiente.delete(campo);
			else siguiente.add(campo);

			return siguiente;
		});
	}

	async function aplicar(soloCategoria: boolean) {
		try {
			await aplicarMutation.mutateAsync({
				id: documento.id,
				payload: {
					campos: soloCategoria ? [] : Array.from(seleccionados),
					aplicar_categoria: soloCategoria
				}
			});
			enqueueSnackbar(t('documentos.ia.aplicado'), { variant: 'success' });

			if (!soloCategoria) setSeleccionados(new Set());
		} catch (error) {
			enqueueSnackbar(await extractErrorMessage(error), { variant: 'error' });
		}
	}

	return (
		<Paper className="mt-4 flex flex-col gap-3 rounded-xl p-4">
			<div className="flex items-center gap-2">
				<Typography className="font-semibold">{t('documentos.ia.titulo')}</Typography>
				<Chip
					size="small"
					label={info && t(info.labelKey)}
					color={info?.color}
				/>
			</div>

			<ClienteDelDocumento
				documento={documento}
				onActualizado={setDocumento}
			/>

			{documento.estado_ia === 'PROCESANDO' && (
				<div className="flex items-center gap-2">
					<CircularProgress size={16} />
					<Typography
						variant="body2"
						color="text.secondary"
					>
						{t(estadoIaInfo('PROCESANDO')!.labelKey)}
					</Typography>
				</div>
			)}

			{(documento.estado_ia === 'ERROR' || documento.estado_ia === 'SIN_CLAVE') && documento.error_ia && (
				<Typography
					variant="body2"
					color="text.secondary"
				>
					{t('documentos.ia.errorPrefijo', { motivo: documento.error_ia })}
				</Typography>
			)}

			{(documento.estado_ia === 'COMPLETADO' || documento.estado_ia === 'SIMULADO') &&
				documento.cliente !== null && (
					<>
						{documento.categoria_sugerida && documento.categoria_sugerida !== documento.categorie && (
							<div className="flex items-center gap-2">
								<Typography variant="body2">
									{t('documentos.ia.categoriaSugerida', {
										categoria: t(categoriaLabelKey(documento.categoria_sugerida))
									})}
								</Typography>
								<Button
									size="small"
									onClick={() => aplicar(true)}
									disabled={aplicarMutation.isPending}
								>
									{t('documentos.ia.usarCategoria')}
								</Button>
							</div>
						)}

						{campos.length === 0 ? (
							<Typography
								variant="body2"
								color="text.disabled"
							>
								{t('documentos.ia.sinDatos')}
							</Typography>
						) : (
							<>
								<div className="flex flex-col">
									{campos.map(([campo, valeur]) => (
										<FormControlLabel
											key={campo}
											control={
												<Checkbox
													size="small"
													checked={seleccionados.has(campo)}
													onChange={() => toggle(campo)}
												/>
											}
											label={`${t(ETIQUETAS_CAMPO[campo])}: ${valeur}`}
										/>
									))}
								</div>
								<Button
									variant="contained"
									size="small"
									className="self-start"
									disabled={seleccionados.size === 0 || aplicarMutation.isPending}
									onClick={() => aplicar(false)}
								>
									{t('documentos.ia.aplicarBoton')}
								</Button>
							</>
						)}
					</>
				)}
		</Paper>
	);
}

export default DocumentoValidacionIA;
